/**
 * Apollo Client 配置
 */

import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'

// 錯誤處理 Link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
          locations
        )}, Path: ${path}`
      )

      // ✅ 處理認證錯誤：觸發自動登出事件
      const authErrorPatterns = [
        '請先登入',
        '用戶不存在',
        '請重新登入',
        '認證',
        'unauthorized',
        'unauthenticated',
      ]

      const isAuthError = authErrorPatterns.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
      )

      if (isAuthError) {
        console.warn('🔒 檢測到認證錯誤，觸發自動登出:', message)

        // 發送自定義事件，讓 AuthContext 處理登出
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-error', { detail: { message } }))
        }
      }
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

// 認證 Link - 自動從 localStorage 獲取 token
const authLink = setContext((_, { headers }) => {
  // 從 localStorage 獲取 token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// HTTP Link
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql',
  credentials: 'same-origin',
})

// 創建 Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

// 帶認證的 Apollo Client（用於需要登入的操作）
export function createAuthenticatedClient(token: string) {
  const authLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql',
    credentials: 'same-origin',
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  })

  return new ApolloClient({
    link: from([errorLink, authLink]),
    cache: new InMemoryCache(),
  })
}
