import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Next.js 16 Proxy - 路由層級權限檢查
 * 使用 jose 庫（Edge Runtime 兼容）
 *
 * 安全措施：強制要求 JWT_SECRET 環境變數
 *
 * 注意：Next.js 16 將 middleware 重命名為 proxy
 */

// 注意：Edge Runtime 中不能使用 throw 來阻止啟動
// 但如果 JWT_SECRET 未設定，驗證會失敗，用戶會被重定向到登入頁
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
)

// 標記是否正確配置
const IS_JWT_CONFIGURED = !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32

interface JWTPayload {
  userId: string
  email: string
  role: string
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  // 安全檢查：如果 JWT_SECRET 未正確配置，拒絕所有驗證
  if (!IS_JWT_CONFIGURED) {
    console.error('安全錯誤：JWT_SECRET 未設定或過短')
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

export async function proxy(request: NextRequest) {
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
 * 配置 Proxy 匹配的路由
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    // ✅ 移除 /checkout/:path* - 允許訪客訪問
  ],
}
