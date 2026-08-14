import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

const packageName = 'dsh-luna-pet'
const spriteBytes = readFileSync(new URL('./assets/luna-spritesheet.webp', import.meta.url))
const spriteDataUrl = `data:image/webp;base64,${spriteBytes.toString('base64')}`

export default defineConfig([
  {
    name: packageName,
    entry: { index: 'lib/types/index.js' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  {
    name: `${packageName}/client`,
    entry: { client: 'lib/types/client/index.js' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    external: ['react'],
    noExternal: (id: string) => id === 'react' ? undefined : true,
    define: {
      __LUNA_SPRITE_DATA_URL__: JSON.stringify(spriteDataUrl),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageName)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
