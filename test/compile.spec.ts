import { run } from 'shellbee'
import { File, Directory } from 'atma-io'

const PROJ = `./test/fixtures/hardhat-project/`;
const PROJ_ARTIFACTS = `${PROJ}/artifacts/`;
const PROJ_0xWEB = `${PROJ}/0xweb/`;
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
        let content = await File.readAsync(`${PROJ}/0xweb/hardhat/Foo/Foo.ts`, { skipHooks: true });
        has_(content, 'class Foo extends ContractBase');
    }
})
