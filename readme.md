# [Hardhat](https://hardhat.org/) plugin for [`0xWeb`](https://0xweb.org)


----
[![NPM version](https://badge.fury.io/js/0xweb/hardhat.svg)](http://badge.fury.io/js/0xweb/hardhat)
[![CircleCI](https://circleci.com/gh/0xweb-org/hardhat.svg?style=svg)](https://circleci.com/gh/0xweb-org/hardhat)


The plugin generates `0xWeb` classes for compiled solidity contracts, making the blockchain development transparent.

> We use [📦 dequanto library](https://github.com/0xweb-org/dequanto) for the classes

---
[Documentation 📜](https://docs.0xweb.org/hardhat)
---

# Install

### Install automatically the dependencies and configurations
```bash
# install 0xweb
$ npm i 0xweb -g

# initiallize 0xweb and hardhat project
$ 0xweb init --hardhat
```



# Compile

> `any/directory/Foo.sol`

```solidity
pragma solidity ^0.8.2;

contract Foo {
    string public name;

    function setName(string memory _name) public {
        name = _name;
    }
}

```

> Plugin adds also ability to specify the `sources` folder. As per default this is `/contracts/**.sol`

```bash
$ npx hardhat compile --sources ./any/directory/
```

# Use in local development

> `example.ts`
```ts
import { Foo } from '@0xweb/hardhat/Foo/Foo.ts'
import { HardhatProvider } from '@dequanto/hardhat/HardhatProvider'

// automatically deploys the contract to hardhat chain
const deployer = new HardhatProvider();
const foo = await deployer.resolve(Foo);

// write
const tx = await foo.setName('Hello world')
const receipt = await tx.wait();

// read
const text = await foo.name();

```

# Use already deployed contracts to any chain

If the contract is already deployed, initialize the contract with the Address as normal class. If the contract is deployed to any other chain - set also the client in constructor

> `example.ts`
```ts
import { Foo } from '@0xweb/hardhat/Foo/Foo.ts'
import { EthWeb3Client } from '@dequanto/clients/EthWeb3Client'


const client =  new EthWeb3Client();
const foo = new Foo('0x12345...', client);

// write
const tx = await foo.setName('Hello world');
const receipt = tx.wait();
// read
const text = await foo.name();
```


# Additional parameters

- `npx hardhat compile --source /foo/bar/qux` - compiles solidity files which are located outside the `/contracts` folder
- `npx hardhat compile --artifacts /dist` - set custom folder for artifacts (ABI JSONs and TS contracts)

----
