import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // React e o roteador mudam pouco: chunk próprio, cache longo no navegador.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'vendor';
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
