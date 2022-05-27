import { run } from 'shellbee'
import { File, Directory } from 'atma-io'
import alot from 'alot';

const PROJ = `./test/fixtures/integration/`;
const PROJ_ARTIFACTS = `${PROJ}/artifacts/`;
const PROJ_0xWEB = `${PROJ}/0xweb/`;
const PROJ_DEQUANTO = `${PROJ}/dequanto/`;
UTest({
    $config: {
        timeout: 1000 * 60 * 15
    },
    async $before () {
        let clean = [
            PROJ_ARTIFACTS,
            PROJ_0xWEB,
            PROJ_DEQUANTO,
            `${PROJ}/node_modules/`,
            `${PROJ}/package.json`,
            `${PROJ}/hardhat.config.js`,
        ];
        await alot(clean).forEachAsync(async path => {
            const Ctor = /\.\w+$/.test(path) ? File : Directory;
            if (await Ctor.existsAsync(path)) {
                await Ctor.removeAsync(path);
            }
        })
    },
    async $after () {
        await Directory.removeAsync(`${PROJ}/.git/`);
        await File.removeAsync(`${PROJ}/.gitmodules`);
    },
    async 'should initialize and compile the project' () {
        let { stdout } = await run({
            command: `0xweb -v`,
            silent: true
        });
        let has0xWeb = /0xweb@\d+\.\d+\.\d+/.test(stdout.join('\n'));
        if (has0xWeb === false) {
            await run({
                command: 'npm i 0xweb -g',
                cwd: PROJ
            });
        }
        await run({
            command: '0xweb init --hardhat',
            cwd: PROJ
        });

        await File.replaceAsync(`${PROJ}/hardhat.config.js`, '@0xweb/hardhat', '../../../lib/index');

        await run({
            command: 'node --openssl-legacy-provider compile.js',
            cwd: PROJ
        });

        {
            let { stdout } = await run({
                command: 'npx atma --openssl-legacy-provider run example.ts',
                cwd: PROJ
            });

            has_(stdout.join('\n'), /First: Lorem/g);
            has_(stdout.join('\n'), /Second: ResetLorem/g);
        }
    }
})
