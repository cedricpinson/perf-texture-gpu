import { defineConfig } from 'vite'

export default defineConfig({
    base: '/perf-texture-gpu/',
    build: {
        sourcemap: true,
        outDir: 'dist',
        assetsDir: 'assets'
    }
})