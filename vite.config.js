import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [
      react({
        // Faster HMR in dev — babel is only used for fast-refresh
        fastRefresh: true,
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    css: {
      devSourcemap: !isProd,
    },

    build: {
      // ES2020 = broad modern browser support without legacy polyfills
      // Better than 'esnext' which targets the build machine's Node, not browsers
      target: 'es2020',

      minify: 'esbuild',

      // Source maps: hidden in prod (available for error tracking tools like Sentry
      // but not served to the browser), full in dev via css.devSourcemap
      sourcemap: isProd ? 'hidden' : true,

      rollupOptions: {
        output: {
          manualChunks: {
            // Core React runtime — cached across all pages
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Supabase SDK — large, rarely changes
            'vendor-supabase': ['@supabase/supabase-js'],
            // Animation library — separated so it doesn't block initial paint
            'vendor-motion': ['framer-motion'],
            // State management
            'vendor-store': ['zustand'],
            // Icon set — tree-shaken at import level
            'vendor-icons': ['lucide-react'],
            // Toast notifications — small but isolated
            'vendor-toast': ['react-hot-toast'],
          },
          // Stable, readable chunk filenames for easier cache debugging
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },

      // Warn if any chunk exceeds 800KB uncompressed
      chunkSizeWarningLimit: 800,

      // Don't copy files < 4KB into base64 — keeps bundle leaner
      assetsInlineLimit: 4096,

      // Clear output dir before each build — prevents stale chunks
      emptyOutDir: true,
    },

    server: {
      port: 3000,
      strictPort: false,
      // Vite handles SPA fallback natively — no historyApiFallback needed
      open: false,
    },

    preview: {
      port: 4173,
      // Correct way to enable SPA fallback in vite preview
      // (Vercel/Netlify handle this via their own config, so only matters locally)
      host: true,
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
  }
})