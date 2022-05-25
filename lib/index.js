
// source ./RootModule.js
(function(){
	
	var _src_config = {};
var _src_constants = {};
var _src_type_extensions = {};

// source ./ModuleSimplified.js
var _src_type_extensions;
(function () {
    // ensure AMD is not active for the model, so that any UMD exports as commonjs
    var define = null;
    var exports = _src_type_extensions != null ? _src_type_extensions : {};
    var module = { exports: exports };

    "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("hardhat/types/config");
//# sourceMappingURL=type-extensions.js.map
//# sourceMappingURL=type-extensions.ts.map;

    function __isObj(x) {
        return x != null && typeof x === 'object' && x.constructor === Object;
    }
    if (_src_type_extensions === module.exports) {
        // do nothing if
    } else if (__isObj(_src_type_extensions) && __isObj(module.exports)) {
        Object.assign(_src_type_extensions, module.exports);
    } else {
        _src_type_extensions = module.exports;
    }

    ;
}());

// end:source ./ModuleSimplified.js


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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
_src_type_extensions;
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const config_1 = require("hardhat/config");
const config_2 = _src_config;
const constants_1 = _src_constants;
const atma_io_1 = require("atma-io");
const alot_1 = require("alot");
const _0xweb_1 = require("0xweb");
const taskArgsStore = { noTypechain: false, fullRebuild: false };
(0, config_1.extendConfig)((config) => {
    config['0xweb'] = (0, config_2.resolveConfig)(config);
});
(0, config_1.task)(task_names_1.TASK_COMPILE, 'Compiles the entire project, building all artifacts')
    .addOptionalParam('sources', 'Override the sources directory')
    .addOptionalParam('artifacts', 'Override the artifacts output directory')
    .addFlag('noTypechain', 'Skip Typechain compilation')
    .setAction(async (compilationArgs, { run, config }, runSuper) => {
    if (compilationArgs.sources) {
        config.paths.sources = process.cwd() + compilationArgs.sources;
    }
    if (compilationArgs.artifacts) {
        config.paths.artifacts = process.cwd() + compilationArgs.artifacts;
    }
    await runSuper();
});
(0, config_1.subtask)(task_names_1.TASK_COMPILE_SOLIDITY_COMPILE_JOBS, 'Compiles the entire project, building all artifacts')
    .setAction(async (taskArgs, { run }, runSuper) => {
    const compileSolOutput = await runSuper(taskArgs);
    await run(constants_1.TASK_0xWEB_GENERATE, { compileSolOutput });
    return compileSolOutput;
});
(0, config_1.subtask)(constants_1.TASK_0xWEB_GENERATE)
    .setAction(async (a, b) => {
    let { compileSolOutput } = a;
    let { config, artifacts } = b;
    const contracts = await getCompiledAbis(config, compileSolOutput);
    const app = new _0xweb_1.App();
    await (0, alot_1.default)(contracts)
        .forEachAsync(async (contract, i) => {
        console.log(`Generation ${contract.name}(${contract.path}) ${i}/${contracts.length}`);
        await app.execute([`install`, `${contract.path}`, '--name', contract.name, '--chain', 'hardhat']);
    })
        .toArrayAsync({ threads: 1 });
});
(0, config_1.task)(constants_1.TASK_0xWEB, 'Generate Typechain typings for compiled contracts').setAction(async (_, { run }) => {
    taskArgsStore.fullRebuild = true;
    await run(task_names_1.TASK_COMPILE, { quiet: true });
});
(0, config_1.task)(task_names_1.TASK_CLEAN, 'Clears the cache and deletes all artifacts', async ({ global }, { config }, runSuper) => {
    if (global) {
        return;
    }
    if (await atma_io_1.File.existsAsync(config.typechain.outDir)) {
        await atma_io_1.File.removeAsync(config.typechain.outDir);
    }
    await runSuper();
});
async function getCompiledAbis(config, compileSolOutput) {
    const emitedArtifacts = (0, alot_1.default)(compileSolOutput.artifactsEmittedPerJob).mapMany((a) => {
        return (0, alot_1.default)(a.artifactsEmittedPerFile).mapMany((artifactPerFile) => {
            return (0, alot_1.default)(artifactPerFile.artifactsEmitted).map((artifactName) => {
                return {
                    name: artifactName,
                    sourceFile: 'file://' + artifactPerFile.file.absolutePath
                };
            }).toArray();
        }).toArray();
    }).toArray();
    let namesHash = (0, alot_1.default)(emitedArtifacts).toDictionary(x => x.name);
    let files = await atma_io_1.Directory.readFilesAsync(`file://${config.paths.artifacts}/`, '**.json');
    let arr = files
        .map(file => {
        let path = file.uri.toString();
        let match = /(?<name>[^\\\/]+)\.sol[\\\/]/.exec(path);
        if (match == null) {
            return null;
        }
        let name = match.groups.name;
        if (name in namesHash === false) {
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
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.ts.map

}());
// end:source ./RootModule.js
