/**
 * 認證 Cookie API - 安全設置 JWT Token Cookie
 *
 * 安全措施：
 * - HttpOnly: 防止 JavaScript 讀取（防 XSS）
 * - Secure: 只在 HTTPS 傳輸
 * - SameSite: 防止 CSRF 攻擊
 */

import { NextRequest, NextResponse } from 'next/server'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Cookie 配置
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 天
}

/**
 * POST /api/auth/set-cookie
 * 設置認證 Cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action } = body

    if (action === 'logout') {
      // 登出：清除 Cookie
      const response = NextResponse.json({ success: true })
      response.cookies.set('token', '', {
        ...COOKIE_OPTIONS,
        maxAge: 0,
      })
      return response
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: '缺少 token' },
        { status: 400 }
      )
    }

    // 基本 token 格式驗證（JWT 格式：xxx.xxx.xxx）
    const jwtParts = token.split('.')
    if (jwtParts.length !== 3) {
      return NextResponse.json(
        { error: '無效的 token 格式' },
        { status: 400 }
      )
    }

    // 設置安全的 Cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('token', token, COOKIE_OPTIONS)

    return response
  } catch (error) {
    console.error('設置 Cookie 失敗:', error)
    return NextResponse.json(
      { error: '設置 Cookie 失敗' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/set-cookie
 * 清除認證 Cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('token', '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })
  return response
}
