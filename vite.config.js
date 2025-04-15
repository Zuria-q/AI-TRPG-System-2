import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// 获取仓库名称，用于GitHub Pages部署
const repoName = 'AI-TRPG-System-2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 使用仓库名称作为基本路径，适合GitHub Pages部署
  base: `/${repoName}/`,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // 减少路径长度，避免Windows路径长度限制
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@heroicons/react', 'react-markdown'],
        },
        // 简化文件名，减少路径长度
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 限制块大小警告
    chunkSizeWarningLimit: 1000,
  },
})
