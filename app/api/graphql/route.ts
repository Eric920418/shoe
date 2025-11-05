import { createYoga } from 'graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'
import { getUserFromHeader } from '@/lib/auth'
import {
  createDepthLimitPlugin,
  createComplexityLimitPlugin,
  createRequestLoggerPlugin,
} from '@/lib/graphql-plugins'
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },

  // 安全配置：CORS限制
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['POST', 'GET', 'OPTIONS'],
  },

  // GraphQL 插件（查詢深度、複雜度限制、日誌）
  plugins: [
    createDepthLimitPlugin(10), // 最大查詢深度 10
    createComplexityLimitPlugin(1000), // 最大查詢複雜度 1000
    createRequestLoggerPlugin(), // 請求日誌
  ],

  // 錯誤格式化：根據用戶全局設定，始終顯示完整錯誤信息
  maskedErrors: false,
  logging: {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },

  // 傳遞認證上下文
  context: async ({ request }) => {
    // 1. 優先從 Authorization header 讀取 token
    let authorization = request.headers.get('authorization')

    // 2. 如果沒有 Authorization header，嘗試從 Cookie 讀取
    if (!authorization) {
      const cookies = request.headers.get('cookie')
      if (cookies) {
        const tokenMatch = cookies.match(/(?:^|;\s*)token=([^;]+)/)
        if (tokenMatch) {
          authorization = `Bearer ${tokenMatch[1]}`
        }
      }
    }

    const authUser = getUserFromHeader(authorization || undefined)

    // 重要：同時返回兩種結構以兼容不同 resolver 的 GraphQLContext 定義
    // 1. 嵌套結構：context.user (userResolvers, orderResolvers 等使用)
    // 2. 扁平結構：context.userId, context.userRole (productResolvers 等使用)
    return {
      // 嵌套結構
      user: authUser ? {
        userId: authUser.userId,
        email: authUser.email,
        role: authUser.role,
      } : null,
      // 扁平結構（向後兼容）
      userId: authUser?.userId || null,
      userRole: authUser?.role || null,
      userEmail: authUser?.email || null,
    }
  },

  // 安全配置：限制请求大小
  graphiql: {
    title: '鞋店電商 GraphQL API',
  },
})

// 包裝 handleRequest 以新增 Rate Limiting
async function handleRequestWithRateLimit(request: Request) {
  // Rate Limiting 檢查
  const clientId = getClientIdentifier(request)
  const rateLimitResult = await checkRateLimit(clientId, RateLimitPresets.graphql)

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: '請求過於頻繁，請稍後再試',
            extensions: {
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
            },
          },
        ],
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RateLimitPresets.graphql.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // 執行實際的 GraphQL 请求
  const response = await handleRequest(request)

  // 新增 Rate Limit 頭部
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-RateLimit-Limit', RateLimitPresets.graphql.maxRequests.toString())
  newHeaders.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  newHeaders.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString())

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

export {
  handleRequestWithRateLimit as GET,
  handleRequestWithRateLimit as POST,
  handleRequestWithRateLimit as OPTIONS,
}
