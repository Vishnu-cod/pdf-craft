import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            if (id.includes('pdf-lib')) {
              return 'vendor-pdflib';
            }
            if (id.includes('xlsx') || id.includes('jszip')) {
              return 'vendor-office';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist', 'xlsx', 'jszip'],
  },
});
