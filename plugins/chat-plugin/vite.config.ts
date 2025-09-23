import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      include: ['src/**/*'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatPlugin',
      fileName: 'chat-plugin',
      formats: ['umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        // 确保生成的代码可以在浏览器中运行
        format: 'umd',
        name: 'ChatPlugin',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false, // 开发模式不压缩，便于调试
    watch: {
      include: 'src/**',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});