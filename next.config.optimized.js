/** @type {import('next').NextConfig} */
const nextConfig = {
  // 圖片優化配置 - 極致優化
  images: {
    domains: ['localhost', 'via.placeholder.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'], // 優先使用現代格式
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400, // 24小時快取
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 性能優化
  compress: true,
  swcMinify: true,

  // 生產環境優化
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // 實驗性功能 - 更激進的優化
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 優化包導入
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      'date-fns',
      '@apollo/client',
      'react-hook-form',
    ],
    // 啟用部分預渲染
    ppr: true,
    // 優化 CSS
    optimizeCss: true,
    // Web Vitals 追蹤
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  // Webpack 配置優化 - 更激進的分割
  webpack: (config, { dev, isServer }) => {
    // 生產環境優化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000, // 限制單個 chunk 大小
          cacheGroups: {
            default: false,
            vendors: false,

            // React 相關
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // Apollo GraphQL
            apollo: {
              name: 'apollo',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@apollo|graphql)[\\/]/,
              priority: 35,
              enforce: true,
            },

            // UI 庫
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](lucide-react|@heroicons|react-hot-toast|react-spinners)[\\/]/,
              priority: 30,
              enforce: true,
            },

            // 表單處理
            forms: {
              name: 'forms',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              priority: 25,
              enforce: true,
            },

            // 動畫庫（延遲載入）
            animations: {
              name: 'animations',
              chunks: 'async',
              test: /[\\/]node_modules[\\/](gsap|react-scroll-parallax|react-intersection-observer)[\\/]/,
              priority: 20,
              enforce: true,
            },

            // 工具庫
            utils: {
              name: 'utils',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](date-fns|js-cookie|clsx|tailwind-merge)[\\/]/,
              priority: 15,
              enforce: true,
            },

            // 其他 vendor
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              enforce: true,
            },

            // 公共代碼
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }

      // 移除大型庫的 source maps
      config.module.rules.push({
        test: /\.(js|mjs|jsx)$/,
        enforce: 'pre',
        exclude: /@babel(?:\/|\\{1,2})runtime/,
        use: ['source-map-loader'],
      })

      // 忽略不需要的 moment locales
      config.plugins.push(
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      )
    }

    // Tree shaking 優化
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // 使用更小的 lodash 構建
        'lodash': 'lodash-es',
      }
    }

    return config
  },

  // HTTP 頭部配置 - 優化快取
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // 靜態資源快取
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 字體快取
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // 重定向優化
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // 環境變數
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql',
  },

  // Bundle 分析
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: true,
        })
      )
      return config
    },
  }),
}

module.exports = nextConfig