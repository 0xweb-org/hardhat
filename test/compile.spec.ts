import { run } from 'shellbee'
import { File, Directory } from 'atma-io'

const PROJ = `./test/fixtures/hardhat-project/`;
const PROJ_ARTIFACTS = `${PROJ}/artifacts/`;
const PROJ_0xWEB = `${PROJ}/0xc/`;
UTest({
    async $before () {
        if (Directory.exists(PROJ_ARTIFACTS)) {
            await Directory.removeAsync(PROJ_ARTIFACTS);
        }
        if (Directory.exists(PROJ_0xWEB)) {
            await Directory.removeAsync(PROJ_0xWEB);
        }
    },
    async 'should compile the project' () {

        let result = await run({
            command: 'node --openssl-legacy-provider compile.js',
            cwd: PROJ
        });
        let path = `${PROJ_0xWEB}/hardhat/Foo/Foo.ts`;
        if (await File.existsAsync(path) === false) {
            console.log('stdout', result.stdout);
            console.log('stderr', result.stderr);
            throw new Error(`File ${path} not found`);
        }
        let content = await File.readAsync(path, { skipHooks: true });
        has_(content, 'class Foo extends ContractBase');
    }
})
