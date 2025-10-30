import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Next.js Middleware - 路由層級權限檢查
 * 使用 jose 庫（Edge Runtime 兼容）
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

interface JWTPayload {
  userId: string
  email: string
  role: string
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 獲取 token（從 Cookie 或 Header）
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

  // 驗證 token
  const user = token ? await verifyToken(token) : null

  // ==========================================
  // 1. 保護後台管理路由 - 只有 ADMIN 可訪問
  // ==========================================
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // 未登入，跳轉到管理員登入頁
      const loginUrl = new URL('/admin-login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (user.role !== 'ADMIN') {
      // 非管理員，返回 403 錯誤頁面
      return NextResponse.rewrite(new URL('/403', request.url))
    }

    // 管理員，允許訪問
    return NextResponse.next()
  }

  // ==========================================
  // 2. 保護用戶帳戶頁面 - 需要登入
  // ==========================================
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ==========================================
  // 3. 結帳頁面 - ✅ 允許訪客訪問（移除強制登入檢查）
  // ==========================================
  // 已移除結帳頁面的登入強制要求，改為頁面內部處理訪客模式

  // 其他路由，允許訪問
  return NextResponse.next()
}

/**
 * 配置 Middleware 匹配的路由
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    // ✅ 移除 /checkout/:path* - 允許訪客訪問
  ],
}
