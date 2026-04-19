import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'electron/main.js')
        }
      },
      plugins: [{
        name: 'copy-assets',
        closeBundle() {
          const outDir = resolve(__dirname, 'out/main/assets')
          const srcDir = resolve(__dirname, 'electron/assets')
          if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
          if (existsSync(srcDir)) {
            for (const file of ['icon.icns', 'icon.png', 'icon.svg']) {
              const src = resolve(srcDir, file)
              if (existsSync(src)) copyFileSync(src, resolve(outDir, file))
            }
          }
        }
      }]
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'preload.cjs')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0])
    },
    plugins: [vue()]
  }
})
