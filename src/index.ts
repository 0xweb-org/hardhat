import alot from 'alot'
import { Directory } from 'atma-io'
import { App } from '0xweb'

import { TASK_CLEAN, TASK_COMPILE, TASK_COMPILE_SOLIDITY_COMPILE_JOBS } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, subtask, task, types } from 'hardhat/config'

import { resolveConfig } from './config'
import { TASK_0xWEB, TASK_0xWEB_GENERATE, TASK_COVERAGE } from './constants'
import { $path } from './utils/$path';
import { $coverage } from './coverage/$coverage'
import { $command } from './utils/$command'

const taskArgsStore = { compileAll: false }

extendConfig((config) => {
    config['0xweb'] = resolveConfig(config)
})

task(TASK_COMPILE, 'Compiles the entire project, building all artifacts')
    .addOptionalParam('sources', 'Override the sources directory')
    .addOptionalParam('artifacts', 'Override the artifacts output directory')
    .addOptionalParam('root', 'Overrides root directory. If sources is also overridden must be the sub-folder of the sources dir')
    .addOptionalParam('package', 'Compile the contracts within a specific mono-repo package. Artifacts and 0xc classes will be placed in the package directory')
    .addOptionalParam('tsgen', 'Skip the TypeScript class generation', true, types.boolean)
    .addOptionalParam('install', 'CSV sol path to install, default installs all compiled contracts from sources')
    .addFlag('watch', 'Watch sources directory and reruns compilation task on changes')

    .setAction(async (
        compilationArgs: {
            sources?: string
            artifacts?: string
            root?: string
            watch?: boolean
            tsgen?: boolean
            install?: string
            package?: string
        },
        { run, config, artifacts },
        runSuper
    ) => {

        ConfigHelper.resetPaths(config.paths);

        if (compilationArgs.tsgen === false) {
            config['0xweb'].tsgen = false;
        }
        if (compilationArgs.install != null) {
            config['0xweb'].install = compilationArgs.install;
        }
        if (compilationArgs.package != null) {
            config['0xweb'].package = compilationArgs.package;

            if (compilationArgs.artifacts == null) {
                compilationArgs.artifacts = $path.join(compilationArgs.package, 'artifacts');
            }
            if (compilationArgs.sources == null) {
                compilationArgs.sources = $path.join(compilationArgs.package, 'contracts');
            }
            config.paths.cache = $path.join(compilationArgs.package, 'cache');
        }


        // Re-set Artifacts Path manually, as Hardhat initializes the Artifacts Instance before this task runs.
        // Other paths (sources, cache) will be resolved later by hardhat from config
        const artifactsInstance = artifacts as (typeof artifacts & { _artifactsPath: string, _validArtifacts: any[] });
        if (artifactsInstance._artifactsPath == null) {
            console.error(`Artifacts Internal interface was changed. Trying to set private _artifactsPath, but it doesn't exist.`);
        }
        // Clean artifacts from previous compile
        artifactsInstance._validArtifacts = [];
        artifactsInstance._artifactsPath = config.paths.artifacts;

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
            artifactsInstance._artifactsPath = artifactsDir;
        }

        if (compilationArgs.watch) {
            const directory = `file://${config.paths.sources}/`;
            Directory.watch(directory, async (...args) => {
                try {
                    await runSuper();
                } catch (error) {
                    console.log(`Compilation failed`, error);
                    console.log(`Watching...`);
                }
            });
            try {
                await runSuper();
            } catch (error) {
                console.log(`Compilation failed`, error);
                console.log(`Watching...`);
            }
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
        const pkg = config['0xweb'].package;
        const app = new App();
        await alot(contracts)
            .forEachAsync(async (contract, i) => {
                console.log(`⏳ Generate ${contract.name}(${contract.path}) ${i}/${contracts.length}`);
                const params = [
                    `install`, `${contract.path}`,
                    '--name', contract.name,
                    '--chain', 'hardhat',
                    '--save-sources', false
                ];
                if (pkg != null) {
                    params.push('--output', $path.join(pkg, '0xc'));
                }
                await app.execute(params);
            })
            .toArrayAsync({ threads: 4 })
    });


task(TASK_0xWEB, 'Generate 0xweb classes for compiled contracts')
    .setAction(async (_, { run }) => {
        taskArgsStore.compileAll = true
        await run(TASK_COMPILE, { quiet: true })
    });


task(TASK_COVERAGE, 'Instrument sol files, compile')
    .addOptionalParam('contracts', 'Optionally the contracts folder', './contracts/')
    .addOptionalParam('out', 'Optionally the output folder', './coverage/contracts/')
    .addOptionalParam('report', 'Optionally the output folder', './coverage/report/')
    .addOptionalParam('test', 'Test command (should be the npx compatible command)')
    .setAction(async (cliArgs: {
        contracts?: string
        out?: string
        report?: string
    }, { run }) => {

        await run(TASK_CLEAN, { quiet: true });
        const source = cliArgs.contracts || './contracts/';
        const target = cliArgs.out || './coverage/contracts/';
        await $coverage.instrumentFiles({
            source,
            target,
        });
        await $coverage.compile({ contracts: target });
        await $command.utest();
        await $coverage.report();
    });

task(TASK_CLEAN, 'Clears the cache and deletes all artifacts')
    .addOptionalParam('package', 'Optionally clears the 0xc classes for a specific mono-repo package')
    .setAction(async (cliArgs: { global?: boolean, package?: string }, { config }, runSuper) => {
        if (cliArgs.global) {
            return;
        }
        let dir = `/0xc/hardhat/`;

        if (cliArgs.package != null) {
            config.paths.artifacts = $path.join(config.paths.root, cliArgs.package, 'artifacts/');
            config.paths.cache = $path.join(config.paths.root, cliArgs.package, 'cache/');
            dir = $path.join(cliArgs.package, dir);
        }
        if (await Directory.existsAsync(dir)) {
            console.log(`Clearing ${dir}`);
            await Directory.removeAsync(dir);
        }
        await runSuper()
    });

async function getCompiledAbis(config: {
    paths: {
        // system path directory with the artifacts output
        artifacts: string
        // system path directory with the contract sources
        sources: string
    }
    '0xweb'?: {
        // SOL files or contract names as CSV
        install?: string
    }
}, compileSolOutput: {
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
    const sources = config.paths.sources;
    const installs = config['0xweb']?.install?.split(',').map(x => x.trim()) ?? null;

    const emittedArtifacts = alot(compileSolOutput.artifactsEmittedPerJob).mapMany((a) => {
        return alot(a.artifactsEmittedPerFile).mapMany((artifactPerFile) => {
            return alot(artifactPerFile.artifactsEmitted).map((artifactName) => {
                return {
                    // Contract Name
                    artifactName: artifactName,
                    // Contract local path, aka import
                    sourceName: artifactPerFile.file.sourceName,
                    // Contract system path, aka file path
                    sourceFile: 'file://' + artifactPerFile.file.absolutePath
                };
            })
            .filter(x => {
                if (installs != null) {
                    let shouldInstall = installs.some(toInstall => {
                        return x.artifactName === toInstall || x.sourceName?.toLowerCase() === toInstall.toLowerCase()
                    });
                    return shouldInstall;
                }
                if (sources != null) {
                    return $path.normalize(x.sourceFile).toLowerCase().startsWith(`file://${$path.normalize(sources).toLowerCase()}`);
                }
                return false;
            })
            //.filter(x => x.sourceFile.includes('@openzeppelin') === false)
            .toArray();
        }).toArray();
    }).toArray();

    let namesHash = alot(emittedArtifacts).toDictionary(x => x.artifactName);
    let files = await Directory.readFilesAsync(`file://${config.paths.artifacts}/`, '**.json');
    let compileAll = taskArgsStore.compileAll;
    let arr = files
        .map(file => {
            let path = file.uri.toString();

            let match = /(?<sourceFileName>[^\\\/]+)\.sol[\\\/]/.exec(path);
            if (match == null) {
                return null;
            }
            // assume artifactName === sourceFileName @TODO consider to handle different file-contract names
            let name = match.groups.sourceFileName;
            if (compileAll !== true && name in namesHash === false) {
                return null;
            }
            if (new RegExp(`[\\\/]${name}\\.json$`).test(path) === false) {
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


namespace ConfigHelper {
    let $backup;
    export function resetPaths (paths) {
        if ($backup == null) {
            $backup = { ...paths };
            return;
        }
        Object.assign(paths, $backup);
    }
}

export const coverage = $coverage;
