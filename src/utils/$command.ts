export namespace $command {

    export async function utest () {
        const originalExit = process.exit;

        return new Promise((resolve, reject) => {
            (process as any).exit = function (code) {
                resolve(null);
                process.exit = originalExit;
            };

            process.argv = ['node', 'atma', 'test'];
            require('atma');
        });
    }
}
