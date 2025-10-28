/**
 * Edge Runtime 兼容的認證函數
 * 使用 jose 庫代替 jsonwebtoken（不支援 Edge Runtime）
 */

import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

/**
 * 生成 JWT Token (Edge Runtime 版本)
 */
export async function generateTokenEdge(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

/**
 * 驗證 JWT Token (Edge Runtime 版本)
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}
