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
        return pathUtil.join(...paths).replace(/\\/g, '/');
    }
    export function normalize (path: string) {
        path = path
            // Replace all / duplicates, but not near the protocol
            .replace(/(?<![:/])\/{2,}/g, '/')
            // Use forward slashes
            .replace(/\\/g, '/')
            // Replace "foo/./bar" with single slash: "foo/bar"
            .replace(/\/\.\//g, '/')
            ;
        while (true) {
            let next = path.replace(/([^\/]+)\/\.\.\//g, (match, p1) => {
                if (p1 !== '..' && p1 !== '.') {
                    return '';
                }
                return match;
            });
            if (next === path) {
                // nothing to collapse
                break;
            }
            path = next;
        }
        return path;
    }
}
