/**
 * GraphQL Context 類型定義
 * 用於在 resolvers 中訪問用戶認證資訊
 */

export interface Context {
  userId: string | null
  userRole: string | null
  userEmail: string | null
}
