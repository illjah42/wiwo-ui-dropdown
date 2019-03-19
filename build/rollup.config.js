import vue from 'rollup-plugin-vue'
import buble from 'rollup-plugin-buble'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/js/main.js',
  output: {
    name: 'UiDropdown',
    exports: 'named'
  },
  plugins: [
    commonjs(),
    vue({
        css: true,
        compileTemplate: true,
    }),
    buble(),
    terser()
  ],
}