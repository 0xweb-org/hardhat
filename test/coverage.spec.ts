import { Directory, File } from 'atma-io';
import { HardhatProvider } from 'dequanto/hardhat/HardhatProvider';
import { $coverage } from '../src/coverage/$coverage';
import * as hardhat from 'hardhat'

UTest({
    async $before () {
        try {
            await Directory.removeAsync('./coverage/');
        } catch (error) {}

        hardhat.run('clean');
    },
    async generate () {
        let hh = new HardhatProvider();
        let client = await hh.client('hardhat');
        let deployer = await hh.deployer();

        await $coverage.instrumentFiles({
            source: 'test/fixtures/coverage/',
        });
        let [ fooInfo ] = await $coverage.compile({
            contracts: './coverage/contracts/'
        });

        let name = `Lorem${Date.now()}`;
        let { contract: foo } = await hh.deployClass(fooInfo.ContractCtor, {
            deployer,
            arguments: [ name ]
        });

        eq_(name, await foo.getName());

        name = `Ipsum${Date.now()}`;
        await foo.$receipt().setName(deployer, name);
        eq_(name, await foo.getName());

        await $coverage.report();


        let html = await File.readAsync('./coverage/report/index.html');
        has_(html, '<span class="strong">83.33% </span>');
    }
})
