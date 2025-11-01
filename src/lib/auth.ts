import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

/**
 * 生成JWT Token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * 驗證JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * 驗證密碼
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * 從請求頭中提取用戶資訊
 */
export function getUserFromHeader(authorization?: string): JWTPayload | null {
  if (!authorization) return null

  const token = authorization.replace('Bearer ', '')
  return verifyToken(token)
}

/**
 * 檢查是否為管理員
 */
export function requireAdmin(context: any): void {
  if (!context.user || context.user.role !== 'ADMIN') {
    throw new Error('需要管理員權限才能執行此操作')
  }
}
