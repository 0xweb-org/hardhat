import hre from "hardhat";
import memd from 'memd';
import type Ethers from 'ethers'
import { ContractBase } from '@dequanto/contracts/ContractBase';
import { type Constructor } from 'atma-utils/mixin';
import { ChainAccount } from '@dequanto/ChainAccounts';
import { HardhatWeb3Client } from '@dequanto/clients/HardhatWeb3Client';

export class HardhatWeb {

    @memd.deco.memoize()
    static deployer(index: number = 0): ChainAccount {
        const ethers: typeof Ethers = (hre as any).ethers;
        const accounts: any = hre.config.networks.hardhat.accounts;
        const wallet = ethers.Wallet.fromMnemonic(accounts.mnemonic, accounts.path + `/${index}`);
        return {
            key: wallet.privateKey,
            address: wallet.address,
        };
    }

    @memd.deco.memoize()
    static async resolve<T extends ContractBase>(Ctor: Constructor<T>): Promise<T> {

        await ContractProvider.compile();

        const ethers = (hre as any).ethers;

        const Factory: Ethers.ContractFactory = await ethers.getContractFactory(Ctor.name);
        const contract = await Factory.deploy();
        const receipt = await contract.deployed();

        console.log(`Contract ${Ctor.name} deployed to ${contract.address}`);

        const client = ContractProvider.client();
        return new Ctor(contract.address, client);
    }

    static client() {
        const web3 = (hre as any).web3;
        const client = new HardhatWeb3Client({ web3, chainId: 1337 });
        return client;
    }

    @memd.deco.memoize()
    private static async compile () {
        await hre.run('compile');
    }
}
