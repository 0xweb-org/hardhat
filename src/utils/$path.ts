import * as pathUtil from 'path';

export namespace $path {
    export function resolve(path: string) {
        if (path.startsWith('file:')) {
            path = path.replace(/^file:\/\//g, '');
            return path;
        }
        return pathUtil.join(process.cwd(), path)
    }
    export function join (...paths: string[]) {
        return pathUtil.join(...paths);
    }
}
