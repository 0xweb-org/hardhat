import { Config } from '@dequanto/Config';
import { HardhatProvider } from '@dequanto/hardhat/HardhatProvider';
import { Foo } from '@0xweb/hardhat/Foo/Foo';

(async function () {

    await Config.fetch()

    const provider = new HardhatProvider();
    const foo = await provider.resolve<Foo>(Foo, 'Lorem');

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
