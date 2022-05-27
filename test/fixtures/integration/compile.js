const hh = require('hardhat');

(async function() {
    await hh.run('compile', {
        sources: '/foo/bar'
    });
    process.exit();
}());
