/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片优化配置（Next.js 16 移除了 domains，使用 remotePatterns）
  images: {
    // ⚠️ 開發期間關閉圖片優化，減少 Vercel Image Transformations 用量
    // 正式上線前可設為 false 或移除此行
    unoptimized: process.env.NODE_ENV === 'development' || process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
    // 支持所有本地路徑和遠端模式
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // 精簡 deviceSizes，減少生成的圖片變體數量
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256],
    // Next.js 16 默認 minimumCacheTTL 改為 4 小時
    minimumCacheTTL: 14400,
  },

  // 性能优化
  compress: true, // 启用 gzip 压缩
  // 注意：Next.js 16 移除了 swcMinify 選項，默認使用 Turbopack

  // 生产环境优化
  productionBrowserSourceMaps: false, // 禁用源码映射以减少构建大小
  poweredByHeader: false, // 移除 X-Powered-By 头部（安全）

  // 跳过类型检查（生产构建）
  // 注意：Next.js 16 移除了 eslint 配置
  typescript: {
    ignoreBuildErrors: true,
  },

  // 实验性功能
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 优化包导入
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },

  // 移除自定義 splitChunks 配置，使用 Next.js 預設的路由拆分優化

  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql',
  },

  // 性能分析（开发环境）
  // 注意：Next.js 16 默認使用 Turbopack，如需使用 webpack 配置，
  // 請執行 `ANALYZE=true pnpm dev --webpack` 或 `ANALYZE=true pnpm build --webpack`
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')()
      config.plugins.push(new BundleAnalyzerPlugin())
      return config
    },
  }),
}

module.exports = nextConfig
