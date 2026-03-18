import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { serveAssetsPlugin } from './vite-plugin-serve-assets'

const firebaseSWPlugin = () => {
  return {
    name: 'firebase-sw-transform',
    // For development: serve the transformed file via middleware
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/firebase-messaging-sw.js') {
          const swPath = path.resolve(__dirname, 'public/firebase-messaging-sw.js');
          if (fs.existsSync(swPath)) {
            let content = fs.readFileSync(swPath, 'utf8');
            
            // Replace placeholders with current env values
            const env = {
              VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
              VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
              VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
              VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
              VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
              VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
              VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
            };

            Object.entries(env).forEach(([key, value]) => {
              const regex = new RegExp(`['"]${key}['"]`, 'g');
              content = content.replace(regex, `'${value}'`);
            });

            res.setHeader('Content-Type', 'application/javascript');
            res.end(content);
            return;
          }
        }
        next();
      });
    },
    // For build: transform the file content as it's being copied/processed
    // Since it's in public/, we can use closeBundle to overwrite it in dist/
    closeBundle() {
      const swDistPath = path.resolve(__dirname, 'dist/firebase-messaging-sw.js');
      if (fs.existsSync(swDistPath)) {
        let content = fs.readFileSync(swDistPath, 'utf8');
        
        const env = {
          VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
          VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
          VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
          VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
          VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
          VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
          VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
        };

        Object.entries(env).forEach(([key, value]) => {
          const regex = new RegExp(`['"]${key}['"]`, 'g');
          content = content.replace(regex, `'${value}'`);
        });

        fs.writeFileSync(swDistPath, content);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    serveAssetsPlugin(),
    firebaseSWPlugin()
  ],
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp'],
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      strict: false,
    },
    middlewareMode: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./assets"),
    },
    // Ensure single React instance
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Force include React and react-dom to ensure single instance
    include: ["react", "react-dom", "react-apexcharts", "apexcharts"],
    // Exclude problematic packages if needed
    exclude: [],
  },
  build: {
    commonjsOptions: {
      // Ensure proper CommonJS handling
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "gsap"],
          "chart-vendor": ["apexcharts", "react-apexcharts", "recharts"],
          "map-vendor": ["@react-google-maps/api", "leaflet", "react-leaflet"],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify with esbuild (built-in, faster than terser, no extra dependencies needed)
    minify: "esbuild",
  },
});
