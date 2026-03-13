import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Manual chunk splitting for optimal caching and bundle sizes
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached across all pages
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase SDK — large, rarely changes
          'vendor-supabase': ['@supabase/supabase-js'],
          // Animation library — separated so it doesn't block initial paint
          'vendor-motion': ['framer-motion'],
          // State management — tiny but separate for clarity
          'vendor-store': ['zustand'],
          // Icon set — tree-shaken but large source
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Warn if any chunk exceeds 800KB uncompressed
    chunkSizeWarningLimit: 800,
    // Generate source maps for production debugging (can be disabled later)
    sourcemap: false,
  },

  server: {
    port: 3000,
    strictPort: false,
    historyApiFallback: true,   // ← add this
  },

  preview: {
    port: 4173,
  },

  // Optimise cold-start dep pre-bundling in dev
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
      'framer-motion',
      'lucide-react',
      'react-hot-toast',
    ],
  },
})