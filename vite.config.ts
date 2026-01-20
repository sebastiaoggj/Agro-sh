import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
  // Define 'process' como um objeto vazio globalmente para evitar "ReferenceError: process is not defined"
  define: {
    'process': {
      env: {}
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});