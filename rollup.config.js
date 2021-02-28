import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/transfigure.js',
            format: 'cjs',
            exports: 'auto'
        },
        {
            file: 'dist/transfigure-json.min.js',
            format: 'cjs',
            plugins: [terser()],
            exports: 'auto'
        },
        {
            file: 'dist/transfigure-json.browser.js',
            format: 'iife',
            name: 'Transfigurator',
        },
        {
            file: 'dist/transfigure-json.browser.min.js',
            format: 'iife',
            name: 'Transfigurator',
            plugins: [terser()]
        }
    ]
};