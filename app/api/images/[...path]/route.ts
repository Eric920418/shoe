/**
 * 圖片服務 API - 提供上傳圖片的訪問
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 從 URL 參數中獲取檔案路徑
    const filePath = params.path.join('/')
    console.log('請求的檔案路徑:', filePath)

    // 構建完整的檔案路徑
    const fullPath = path.join(process.cwd(), 'public', filePath)
    console.log('完整路徑:', fullPath)

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