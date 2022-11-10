import alot from 'alot'
import * as path from 'path';
import { TASK_CLEAN, TASK_COMPILE, TASK_COMPILE_SOLIDITY_COMPILE_JOBS } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, subtask, task } from 'hardhat/config'
import { resolveConfig } from './config'
import { TASK_0xWEB, TASK_0xWEB_GENERATE } from './constants'
import { Directory } from 'atma-io'
import { App } from '0xweb'

const taskArgsStore = { compileAll: false }

extendConfig((config) => {
    config['0xweb'] = resolveConfig(config)
})

task(TASK_COMPILE, 'Compiles the entire project, building all artifacts')
    .addOptionalParam('sources', 'Override the sources directory')
    .addOptionalParam('artifacts', 'Override the artifacts output directory')
    .addOptionalParam('watch', 'Re-runs compilation task on changes')
    .setAction(async (compilationArgs, { run, config }, runSuper) => {

        if (compilationArgs.sources) {
            config.paths.sources = path.join(process.cwd(), compilationArgs.sources);
        }
        if (compilationArgs.artifacts) {
            config.paths.artifacts = path.join(process.cwd(), compilationArgs.artifacts);
        }
        if (compilationArgs.watch != null) {

            const directory = `file://${config.paths.sources}/`;
            Directory.watch(directory, async (...args) => {
                console.log('XX', args);
                await runSuper();
            });
            await runSuper();
            await new Promise(resolve => {});
            return;
        }

        await runSuper();
    });

subtask(TASK_COMPILE_SOLIDITY_COMPILE_JOBS, 'Compiles the entire project, building all artifacts')
    .setAction(async (taskArgs, { run }, runSuper) => {
        const compileSolOutput = await runSuper(taskArgs)
        await run(TASK_0xWEB_GENERATE, { compileSolOutput })
        return compileSolOutput
    });

subtask(TASK_0xWEB_GENERATE)
    .setAction(async (a, b) => {
        let { compileSolOutput } = a;
        let { config, artifacts } = b;

        const contracts = await getCompiledAbis(config, compileSolOutput)

        const app = new App();
        await alot(contracts)
            .forEachAsync(async (contract, i) => {
                console.log(`Generation ${contract.name}(${contract.path}) ${i}/${contracts.length}`);
                await app.execute([`install`, `${contract.path}`, '--name', contract.name, '--chain', 'hardhat'])
            })
            .toArrayAsync({ threads: 1 })
    });

task(TASK_0xWEB, 'Generate 0xWeb classes for compiled contracts')
    .setAction(async (_, { run }) => {
        taskArgsStore.compileAll = true
        await run(TASK_COMPILE, { quiet: true })
    });

task(TASK_CLEAN, 'Clears the cache and deletes all artifacts')
    .setAction(async ({ global }: { global: boolean }, { config }, runSuper) => {
        if (global) {
            return;
        }
        const dir = `/0xweb/hardhat/`;
        if (await Directory.existsAsync(dir)) {
            await Directory.removeAsync(dir);
        }
        await runSuper()
    });

async function getCompiledAbis(config: { paths: { artifacts: string } }, compileSolOutput: {
    artifactsEmittedPerJob: {
        artifactsEmittedPerFile: {
            file: {
                sourceName: string
                absolutePath: string
            }
            artifactsEmitted: string[]
        }[]
    }[]
}): Promise<{ name: string, path: string }[]> {

    const emitedArtifacts = alot(compileSolOutput.artifactsEmittedPerJob).mapMany((a) => {
        return alot(a.artifactsEmittedPerFile).mapMany((artifactPerFile) => {
            return alot(artifactPerFile.artifactsEmitted).map((artifactName) => {
                return {
                    name: artifactName,
                    sourceFile: 'file://' + artifactPerFile.file.absolutePath
                };
            }).toArray();
        }).toArray();
    }).toArray();

    let namesHash = alot(emitedArtifacts).toDictionary(x => x.name);
    let files = await Directory.readFilesAsync(`file://${config.paths.artifacts}/`, '**.json');
    let compileAll = taskArgsStore.compileAll;
    let arr = files
        .map(file => {
            let path = file.uri.toString();

            let match = /(?<name>[^\\\/]+)\.sol[\\\/]/.exec(path);
            if (match == null) {
                return null;
            }
            let name = match.groups.name;
            if (compileAll !== true && name in namesHash === false) {
                return null;
            }
            if (new RegExp(`${name}\\.json$`).test(path) === false) {
                return null;
            }

            return {
                name: name,
                path: path
            };
        })
        .filter(Boolean);

    return arr;
}
