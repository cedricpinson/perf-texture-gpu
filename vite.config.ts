import { defineConfig } from 'vite'

export default defineConfig({
    base: '/perf-texture-gpu/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
})