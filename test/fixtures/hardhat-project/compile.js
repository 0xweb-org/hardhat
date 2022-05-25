const hh = require('hardhat');

(async function() {
    await hh.run('compile');
    process.exit();
}());
