import { Config } from 'dequanto/config/Config';
import { HardhatProvider } from 'dequanto/hardhat/HardhatProvider';
import { Foo } from '@0xc/hardhat/Foo/Foo';

(async function () {

    await Config.fetch()

    const provider = new HardhatProvider();


    const { contract: foo } = await provider.deployClass<Foo>(Foo, { arguments: ['Lorem'] });

    '> Get initial value'
    let name = await foo.getName();
    console.log(`First:`, name);

    '> Submit value'
    let tx = await foo.setName(provider.deployer(), 'ResetLorem');
    await tx.wait();

    '> Get new value'
    name = await foo.getName();
    console.log(`Second:`, name);

    process.exit();
}());
