const hh = require('hardhat');

(async function() {
    await hh.run('compile', { watch: 'true' });
    process.exit();
}());
