import { readFile } from 'node:fs/promises';

export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        if (/^\.{1,2}\//.test(specifier) && !/\.[a-z0-9]+$/i.test(specifier)) {
            return nextResolve(`${specifier}.js`, context);
        }
        throw error;
    }
}

export async function load(url, context, nextLoad) {
    if (url.startsWith('file:') && /[/\\]src[/\\].+\.js$/i.test(
        decodeURIComponent(new URL(url).pathname)
    )) {
        return {
            format: 'module',
            source: await readFile(new URL(url), 'utf8'),
            shortCircuit: true
        };
    }
    return nextLoad(url, context);
}
