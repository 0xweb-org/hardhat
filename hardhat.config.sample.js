require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
    solidity: {
        version: "0.8.2",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            chainId: 1337
        },
        localhost: {
            chainId: 1337
        },
        mainnet: {
            url: ``,
            accounts: [``]
        }
    },
    etherscan: {
        // One at https://etherscan.io/
        apiKey: ""
    }
};