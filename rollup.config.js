import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/jsoniter.js',
            format: 'cjs',
            exports: 'auto'
        },
        {
            file: 'dist/jsoniter.min.js',
            format: 'cjs',
            plugins: [terser()],
            exports: 'auto'
        },
        {
            file: 'dist/jsoniter.browser.js',
            format: 'iife',
            name: 'JsonIter',
        },
        {
            file: 'dist/jsoniter.browser.min.js',
            format: 'iife',
            name: 'JsonIter',
            plugins: [terser()]
        }
    ]
};