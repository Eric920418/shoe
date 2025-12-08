/**
 * 圖片服務 API - 提供上傳圖片的訪問
 *
 * 安全措施：
 * - 路徑遍歷防護：驗證最終路徑必須在 public 目錄內
 * - 只允許訪問特定的圖片目錄
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 允許訪問的目錄白名單
const ALLOWED_DIRECTORIES = ['uploads', 'images', 'assets']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 從 URL 參數中獲取檔案路徑（Next.js 16 params 為 Promise）
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')

    // 安全檢查 1：檢查是否包含路徑遍歷字符
    if (filePath.includes('..') || filePath.includes('\0')) {
      console.warn('安全警告：檢測到路徑遍歷嘗試:', filePath)
      return new NextResponse('禁止訪問', { status: 403 })
    }

    // 安全檢查 2：驗證第一層目錄是否在白名單中
    const firstDir = pathSegments[0]
    if (!ALLOWED_DIRECTORIES.includes(firstDir)) {
      console.warn('安全警告：嘗試訪問未授權目錄:', firstDir)
      return new NextResponse('禁止訪問', { status: 403 })
    }

    // 構建完整的檔案路徑
    const publicDir = path.resolve(process.cwd(), 'public')
    const fullPath = path.resolve(publicDir, filePath)

    // 安全檢查 3：確保解析後的路徑仍在 public 目錄內（防止符號連結攻擊）
    if (!fullPath.startsWith(publicDir + path.sep)) {
      console.warn('安全警告：路徑逃逸嘗試:', fullPath)
      return new NextResponse('禁止訪問', { status: 403 })
    }

    // 檢查檔案是否存在
    if (!existsSync(fullPath)) {
      console.log('檔案不存在:', fullPath)
      return new NextResponse(`圖片不存在: ${filePath}`, { status: 404 })
    }

    // 讀取檔案
    const fileBuffer = await readFile(fullPath)

    // 判斷檔案類型
    const ext = path.extname(fullPath).toLowerCase()
    let contentType = 'image/jpeg'

    switch (ext) {
      case '.png':
        contentType = 'image/png'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.svg':
        contentType = 'image/svg+xml'
        break
    }

    // 返回圖片資料
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('圖片讀取失敗:', error)
    return new NextResponse('圖片讀取失敗', { status: 500 })
  }
}