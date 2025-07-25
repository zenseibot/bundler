import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-solana': ['@solana/web3.js', '@solana/spl-token'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'react-split'],
          'vendor-utils': ['bs58', 'buffer', 'crypto-js', 'd3'],

          'operations': [
            './src/utils/bonkcreate.ts',
            './src/utils/cookcreate.ts',
            './src/utils/cleaner.ts',
            './src/utils/consolidate.ts',
            './src/utils/distribute.ts',
            './src/utils/mixer.ts'
          ],
          
          // Modal components
          'modals': [
            './src/modals/BurnModal.tsx',
            './src/modals/CalculatePNLModal.tsx', 
            './src/modals/DeployModal.tsx',
            './src/modals/CleanerModal.tsx',
            './src/modals/CustomBuyModal.tsx',
            './src/modals/SettingsModal.tsx',
            './src/modals/WalletsModal.tsx'
          ],
          
          // Page components
          'pages': [
            './src/Wallets.tsx',
            './src/Chart.tsx',
            './src/Actions.tsx',
            './src/Mobile.tsx'
          ],
          
          // Core components
          'components': [
            './src/FloatingTradingCard.tsx',
            './src/TradingForm.tsx',
            './src/PnlCard.tsx'
          ]
        },
        
        // Optimize chunk size
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        }
      }
    },
    
    // Optimize build performance
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    
    allowedHosts: ['localhost', '127.0.0.1', '.ngrok-free.app']
  }
});