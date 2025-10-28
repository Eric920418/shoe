/**
 * LINE Login 回調 API
 *
 * 流程：
 * 1. 用戶從 LINE 授權頁面回來，帶著 code 和 state 參數
 * 2. 這個 API 接收 code 並跳轉到前端驗證頁面
 * 3. 前端再調用 GraphQL lineLoginCallback mutation
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 檢查是否有錯誤
  if (error) {
    console.error('LINE Login 錯誤:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  // 檢查是否有 code
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=未收到授權碼', request.url)
    )
  }

  // 跳轉到前端驗證頁面，帶著 code
  return NextResponse.redirect(
    new URL(`/auth/line-verify?code=${code}&state=${state || ''}`, request.url)
  )
}
