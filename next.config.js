/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片优化配置
  images: {
    domains: ['localhost', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // 性能优化
  compress: true, // 启用 gzip 压缩
  swcMinify: true, // 使用 SWC 压缩代码（更快）

  // 生产环境优化
  productionBrowserSourceMaps: false, // 禁用源码映射以减少构建大小
  poweredByHeader: false, // 移除 X-Powered-By 头部（安全）

  // 实验性功能
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 优化包导入
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },

  // Webpack 配置优化
  webpack: (config, { isServer }) => {
    // 优化包大小（僅客户端，避免 SSR 錯誤）
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 将 node_modules 打包成 vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // 将公共代码打包成 common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }
    return config
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql',
  },

  // 性能分析（开发环境）
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')()
      config.plugins.push(new BundleAnalyzerPlugin())
      return config
    },
  }),
}

module.exports = nextConfig
