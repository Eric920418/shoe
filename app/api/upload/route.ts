/**
 * 圖片上傳 API - 儲存到本地 /public/uploads 資料夾
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的圖片' },
        { status: 400 }
      )
    }

    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '僅支援 JPG、PNG、WebP、SVG 格式的圖片' },
        { status: 400 }
      )
    }

    // 驗證文件大小（限制 5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '圖片大小不能超過 5MB' },
        { status: 400 }
      )
    }

    // 獲取文件擴展名
    const ext = path.extname(file.name)

    // 生成唯一文件名：timestamp_random.ext
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}_${randomStr}${ext}`

    // 確保上傳目錄存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 將文件轉換為 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 保存文件
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // 返回可訪問的 URL 路徑
    const fileUrl = `/uploads/products/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('圖片上傳失敗:', error)
    return NextResponse.json(
      { error: `圖片上傳失敗：${error.message}` },
      { status: 500 }
    )
  }
}
