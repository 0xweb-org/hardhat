import * as Api from 'solidity-coverage/api';

import alot from 'alot';
import memd from 'memd';
import { Directory, File, env } from 'atma-io';
import { $path } from '../utils/$path';
import { HardhatProvider } from 'dequanto/hardhat/HardhatProvider';
import { HardhatWeb3Client } from 'dequanto/hardhat/HardhatWeb3Client';
import { HARDHAT_NETWORK_RESET_EVENT } from "hardhat/internal/constants";

export namespace $coverage {

    let viaIR = true;

    export function config (opts: {
        viaIR?: boolean
    }) {
        viaIR = opts.viaIR ?? viaIR;
    }


    export async function compile(params: {
        // e.g. ./coverage/contracts
        contracts: string
    }) {
        const hh = new HardhatProvider();

        // Ensure optimizer is disabled, otherwise instrumented code will be removed as unused.
        // const hardhat = await hh.getHardhat();
        // hardhat.config.solidity.compilers.forEach(compiler => {
        //     compiler.settings.optimizer.enabled = false;
        // });

        const client = await hh.client('hardhat');
        const result = await hh.compileSolDirectory(params.contracts, {
            tsgen: true
        });
        await attachToHardhatVM(client);
        return result;
    }

    export async function attachToHardhatVM(client: HardhatWeb3Client) {
        const provider = await client.options.web3;
        const api = await ApiUtil.getApi();

        await api.attachToHardhatVM(provider);

        (provider as any).on(HARDHAT_NETWORK_RESET_EVENT, async () => {
            await api.attachToHardhatVM(provider);
        });

        await api.attachToHardhatVM(provider);

    }

    export async function instrumentFiles(params: {
        source: string
        target?: string
    }) {
        let source = params.source;
        let targetDir = params.target ?? './coverage/contracts/';

        let files: File[];

        if (/\.\w+$/.test(source)) {
            files = [new File(source)];
        } else {
            let rgx = /\*/.exec(source);
            if (rgx == null) {
                files = await Directory.readFilesAsync(source, '**/*.sol');
            } else {
                let dir = source.substring(0, rgx.index);
                let glob = source.substring(rgx.index);
                files = await Directory.readFilesAsync(dir, glob);
            }
        }

        let targets = await alot(files)
            .mapAsync(async file => {
                let canonicalPath = file.uri.toLocalFile();
                let relativePath = file.uri.toRelativeString(env.currentDir);
                let source = await file.readAsync();
                return {
                    canonicalPath,
                    relativePath,
                    source,
                };
            })
            .toArrayAsync({ threads: 5 });

        const api = await ApiUtil.getApi();
        const result = await api.instrument(targets) as {
            canonicalPath: string
            relativePath: string
            source: string
        }[];

        await alot(result)
            .forEachAsync(async target => {

                let path = target.relativePath.replace(/^[\/.]*contracts/, '');
                let output = $path.join(targetDir, path);

                await File.writeAsync(output, target.source);
            })
            .toArrayAsync({ threads: 5 })
    }


    export async function report (params?: {
        // e.g. ./coverage/report
        target: string
    }) {
        const targetDir = params?.target ?? './coverage/report';
        const api = await ApiUtil.getApi();
        const result = await api.report(targetDir);
    }

    class ApiUtil {
        @memd.deco.memoize()
        static async getApi() {
            return new Api({ viaIR });
        }
    }
}
