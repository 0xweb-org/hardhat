import alot from 'alot'
import { TASK_CLEAN, TASK_COMPILE, TASK_COMPILE_SOLIDITY_COMPILE_JOBS } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, subtask, task } from 'hardhat/config'

import { resolveConfig } from './config'
import { TASK_0xWEB, TASK_0xWEB_GENERATE } from './constants'
import { Directory } from 'atma-io'
import { App } from '0xweb'
import { $path } from './utils/$path';

const taskArgsStore = { compileAll: false }

extendConfig((config) => {
    config['0xweb'] = resolveConfig(config)
})

task(TASK_COMPILE, 'Compiles the entire project, building all artifacts')
    .addOptionalParam('sources', 'Override the sources directory')
    .addOptionalParam('artifacts', 'Override the artifacts output directory')
    .addOptionalParam('root', 'Overrides root directory. If sources is also overriden must be the sub-folder of the sources dir')
    .addOptionalParam('watch', 'Re-runs compilation task on changes', false, <any> {
        name: 'boolean',
        validate(argName, argumentValue) {},
        parse (val) {
            if (val === '' || val === '1' || val === true || val === 'true') {
                return true;
            }
            return false;
        }
    })
    .addOptionalParam('tsgen', 'Skip the TypeScript class generation', true, <any> {
        name: 'boolean',
        validate(argName, argumentValue) {},
        parse (val) {
            if (val === '0' || val === 0 || val === false || val === 'false') {
                return false;
            }
            return true;
        }
    })
    .setAction(async (
        compilationArgs: { sources?: string, artifacts?: string, root?: string, watch?: boolean, tsgen?: boolean },
        { run, config, artifacts },
        runSuper
    ) => {

        if (compilationArgs.tsgen === false) {
            config['0xweb'].tsgen = false;
        }

        let {
            sources: sourcesDir,
            artifacts: artifactsDir,
            root: rootDir
        } = compilationArgs;

        if (rootDir != null) {
            rootDir = $path.resolve(rootDir);
            if (sourcesDir == null) {
                sourcesDir = `file://${ $path.join(rootDir, 'contracts') }`;
            }
            if (artifactsDir == null) {
                artifactsDir = `file://${ $path.join(rootDir, 'artifacts') }`;
            }
            config.paths.root = rootDir;
            config.paths.cache = $path.join(rootDir, 'cache');
        }
        if (sourcesDir) {
            sourcesDir = $path.resolve(sourcesDir);
            config.paths.sources = sourcesDir;
        }
        if (artifactsDir) {
            artifactsDir = $path.resolve(artifactsDir);
            config.paths.artifacts = artifactsDir

            // Re-set Artifacts Path manually, as Hardhat initializes the Artifacts Instance before this task runs.
            // Other paths (sources, cache) will be resolved later by hardhat from config
            const artifactsInstance = artifacts as (typeof artifacts & { _artifactsPath: string, _validArtifacts: any[] });
            if (artifactsInstance._artifactsPath == null) {
                console.error(`Articats Internal interface was changed. Trying to set private _artifactsPath, but it doesn't exist.`);
            }
            artifactsInstance._artifactsPath = artifactsDir;

            // Clean artifacts from previous compile
            artifactsInstance._validArtifacts = [];
        }

        if (compilationArgs.watch) {
            const directory = `file://${config.paths.sources}/`;
            Directory.watch(directory, async (...args) => {
                await runSuper();
            });
            await runSuper();
            // prevent from exit
            await new Promise(resolve => {});
            return;
        }

        await runSuper();
    });

subtask(TASK_COMPILE_SOLIDITY_COMPILE_JOBS, 'Compiles the entire project, building all artifacts and generating 0xweb TS classes')
    .setAction(async (taskArgs, { run }, runSuper) => {
        const compileSolOutput = await runSuper(taskArgs)
        await run(TASK_0xWEB_GENERATE, { compileSolOutput })
        return compileSolOutput
    });

subtask(TASK_0xWEB_GENERATE)
    .setAction(async (a, b) => {
        let { compileSolOutput } = a;
        let { config, artifacts } = b;

        if (config['0xweb'].tsgen === false) {
            return;
        }

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
            })
            .filter(x => x.sourceFile.includes('@openzeppelin') === false)
            .toArray();
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
