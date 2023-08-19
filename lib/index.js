
// source ./RootModule.js
(function(){
	
	var _src_config = {};
var _src_constants = {};
var _src_utils__path = {};

// source ./ModuleSimplified.js
var _src_config;
(function () {
    // ensure AMD is not active for the model, so that any UMD exports as commonjs
    var define = null;
    var exports = _src_config != null ? _src_config : {};
    var module = { exports: exports };

    "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = void 0;
function resolveConfig(config) {
    var _a;
    const defaultConfig = {};
    return {
        ...defaultConfig,
        ...((_a = config['0xweb']) !== null && _a !== void 0 ? _a : {}),
    };
}
exports.resolveConfig = resolveConfig;
//# sourceMappingURL=config.js.map
//# sourceMappingURL=config.ts.map;

    function __isObj(x) {
        return x != null && typeof x === 'object' && x.constructor === Object;
    }
    if (_src_config === module.exports) {
        // do nothing if
    } else if (__isObj(_src_config) && __isObj(module.exports)) {
        Object.assign(_src_config, module.exports);
    } else {
        _src_config = module.exports;
    }

    ;
}());

// end:source ./ModuleSimplified.js


// source ./ModuleSimplified.js
var _src_constants;
(function () {
    // ensure AMD is not active for the model, so that any UMD exports as commonjs
    var define = null;
    var exports = _src_constants != null ? _src_constants : {};
    var module = { exports: exports };

    "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_0xWEB_GENERATE = exports.TASK_0xWEB = void 0;
exports.TASK_0xWEB = '0xweb';
exports.TASK_0xWEB_GENERATE = '0xweb:generate';
//# sourceMappingURL=constants.js.map
//# sourceMappingURL=constants.ts.map;

    function __isObj(x) {
        return x != null && typeof x === 'object' && x.constructor === Object;
    }
    if (_src_constants === module.exports) {
        // do nothing if
    } else if (__isObj(_src_constants) && __isObj(module.exports)) {
        Object.assign(_src_constants, module.exports);
    } else {
        _src_constants = module.exports;
    }

    ;
}());

// end:source ./ModuleSimplified.js


// source ./ModuleSimplified.js
var _src_utils__path;
(function () {
    // ensure AMD is not active for the model, so that any UMD exports as commonjs
    var define = null;
    var exports = _src_utils__path != null ? _src_utils__path : {};
    var module = { exports: exports };

    "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$path = void 0;
const pathUtil = require("path");
var $path;
(function ($path) {
    function resolve(path) {
        if (path.startsWith('file:')) {
            path = path.replace(/^file:\/\//g, '');
            return path;
        }
        return pathUtil.join(process.cwd(), path);
    }
    $path.resolve = resolve;
    function join(...paths) {
        return pathUtil.join(...paths);
    }
    $path.join = join;
})($path = exports.$path || (exports.$path = {}));
//# sourceMappingURL=$path.js.map
//# sourceMappingURL=$path.ts.map;

    function __isObj(x) {
        return x != null && typeof x === 'object' && x.constructor === Object;
    }
    if (_src_utils__path === module.exports) {
        // do nothing if
    } else if (__isObj(_src_utils__path) && __isObj(module.exports)) {
        Object.assign(_src_utils__path, module.exports);
    } else {
        _src_utils__path = module.exports;
    }

    ;
}());

// end:source ./ModuleSimplified.js

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alot_1 = require("alot");
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const config_1 = require("hardhat/config");
const config_2 = _src_config;
const constants_1 = _src_constants;
const atma_io_1 = require("atma-io");
const _0xweb_1 = require("0xweb");
const _path_1 = _src_utils__path;
const taskArgsStore = { compileAll: false };
(0, config_1.extendConfig)((config) => {
    config['0xweb'] = (0, config_2.resolveConfig)(config);
});
(0, config_1.task)(task_names_1.TASK_COMPILE, 'Compiles the entire project, building all artifacts')
    .addOptionalParam('sources', 'Override the sources directory')
    .addOptionalParam('artifacts', 'Override the artifacts output directory')
    .addOptionalParam('root', 'Overrides root directory. If sources is also overridden must be the sub-folder of the sources dir')
    .addOptionalParam('watch', 'Re-runs compilation task on changes', false, {
    name: 'boolean',
    validate(argName, argumentValue) { },
    parse(val) {
        if (val === '' || val === '1' || val === true || val === 'true') {
            return true;
        }
        return false;
    }
})
    .addOptionalParam('tsgen', 'Skip the TypeScript class generation', true, {
    name: 'boolean',
    validate(key, value) { },
    parse(key, value) {
        if (value === '0' || value === 0 || value === false || value === 'false') {
            return false;
        }
        return true;
    }
})
    .setAction(async (compilationArgs, { run, config, artifacts }, runSuper) => {
    if (compilationArgs.tsgen === false) {
        config['0xweb'].tsgen = false;
    }
    ConfigHelper.resetPaths(config.paths);
    // Re-set Artifacts Path manually, as Hardhat initializes the Artifacts Instance before this task runs.
    // Other paths (sources, cache) will be resolved later by hardhat from config
    const artifactsInstance = artifacts;
    if (artifactsInstance._artifactsPath == null) {
        console.error(`Artifacts Internal interface was changed. Trying to set private _artifactsPath, but it doesn't exist.`);
    }
    // Clean artifacts from previous compile
    artifactsInstance._validArtifacts = [];
    artifactsInstance._artifactsPath = config.paths.artifacts;
    let { sources: sourcesDir, artifacts: artifactsDir, root: rootDir } = compilationArgs;
    if (rootDir != null) {
        rootDir = _path_1.$path.resolve(rootDir);
        if (sourcesDir == null) {
            sourcesDir = `file://${_path_1.$path.join(rootDir, 'contracts')}`;
        }
        if (artifactsDir == null) {
            artifactsDir = `file://${_path_1.$path.join(rootDir, 'artifacts')}`;
        }
        config.paths.root = rootDir;
        config.paths.cache = _path_1.$path.join(rootDir, 'cache');
    }
    if (sourcesDir) {
        sourcesDir = _path_1.$path.resolve(sourcesDir);
        config.paths.sources = sourcesDir;
    }
    if (artifactsDir) {
        artifactsDir = _path_1.$path.resolve(artifactsDir);
        config.paths.artifacts = artifactsDir;
        artifactsInstance._artifactsPath = artifactsDir;
    }
    if (compilationArgs.watch) {
        const directory = `file://${config.paths.sources}/`;
        atma_io_1.Directory.watch(directory, async (...args) => {
            await runSuper();
        });
        await runSuper();
        // prevent from exit
        await new Promise(resolve => { });
        return;
    }
    await runSuper();
});
(0, config_1.subtask)(task_names_1.TASK_COMPILE_SOLIDITY_COMPILE_JOBS, 'Compiles the entire project, building all artifacts and generating 0xweb TS classes')
    .setAction(async (taskArgs, { run }, runSuper) => {
    const compileSolOutput = await runSuper(taskArgs);
    await run(constants_1.TASK_0xWEB_GENERATE, { compileSolOutput });
    return compileSolOutput;
});
(0, config_1.subtask)(constants_1.TASK_0xWEB_GENERATE)
    .setAction(async (a, b) => {
    let { compileSolOutput } = a;
    let { config, artifacts } = b;
    if (config['0xweb'].tsgen === false) {
        return;
    }
    const contracts = await getCompiledAbis(config, compileSolOutput);
    const app = new _0xweb_1.App();
    await (0, alot_1.default)(contracts)
        .forEachAsync(async (contract, i) => {
        console.log(`Generation ${contract.name}(${contract.path}) ${i}/${contracts.length}`);
        await app.execute([`install`, `${contract.path}`, '--name', contract.name, '--chain', 'hardhat']);
    })
        .toArrayAsync({ threads: 1 });
});
(0, config_1.task)(constants_1.TASK_0xWEB, 'Generate 0xWeb classes for compiled contracts')
    .setAction(async (_, { run }) => {
    taskArgsStore.compileAll = true;
    await run(task_names_1.TASK_COMPILE, { quiet: true });
});
(0, config_1.task)(task_names_1.TASK_CLEAN, 'Clears the cache and deletes all artifacts')
    .setAction(async ({ global }, { config }, runSuper) => {
    if (global) {
        return;
    }
    const dir = `/0xweb/hardhat/`;
    if (await atma_io_1.Directory.existsAsync(dir)) {
        await atma_io_1.Directory.removeAsync(dir);
    }
    await runSuper();
});
async function getCompiledAbis(config, compileSolOutput) {
    const emittedArtifacts = (0, alot_1.default)(compileSolOutput.artifactsEmittedPerJob).mapMany((a) => {
        return (0, alot_1.default)(a.artifactsEmittedPerFile).mapMany((artifactPerFile) => {
            return (0, alot_1.default)(artifactPerFile.artifactsEmitted).map((artifactName) => {
                return {
                    name: artifactName,
                    sourceFile: 'file://' + artifactPerFile.file.absolutePath
                };
            })
                .filter(x => x.sourceFile.includes('@openzeppelin') === false)
                .toArray();
        }).toArray();
    }).toArray();
    let namesHash = (0, alot_1.default)(emittedArtifacts).toDictionary(x => x.name);
    let files = await atma_io_1.Directory.readFilesAsync(`file://${config.paths.artifacts}/`, '**.json');
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
var ConfigHelper;
(function (ConfigHelper) {
    let $backup;
    function resetPaths(paths) {
        if ($backup == null) {
            $backup = { ...paths };
            return;
        }
        Object.assign(paths, $backup);
    }
    ConfigHelper.resetPaths = resetPaths;
})(ConfigHelper || (ConfigHelper = {}));
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.ts.map

}());
// end:source ./RootModule.js
