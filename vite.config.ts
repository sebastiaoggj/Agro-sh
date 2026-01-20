import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Garante que os arquivos JS/CSS sejam buscados no caminho relativo correto
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020'
  }
});