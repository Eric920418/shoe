/**
 * 圖片上傳 API - 儲存到本地 /public/uploads 資料夾
 *
 * 安全措施：
 * - 資料夾白名單驗證：只允許上傳到指定目錄
 * - 移除 SVG 支援：防止 XSS 攻擊
 * - 路徑遍歷防護：驗證最終路徑在允許範圍內
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 允許上傳的資料夾白名單
const ALLOWED_FOLDERS = ['products', 'brands', 'categories', 'banners', 'avatars', 'reviews']

// 允許的檔案類型（移除 SVG 防止 XSS）
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// 允許的副檔名
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderInput = (formData.get('folder') as string) || 'products'

    // 安全檢查 1：驗證資料夾參數（只允許白名單內的值）
    const folder = folderInput.toLowerCase().trim()
    if (!ALLOWED_FOLDERS.includes(folder)) {
      console.warn('安全警告：嘗試上傳到未授權資料夾:', folderInput)
      return NextResponse.json(
        { error: '無效的上傳目錄' },
        { status: 400 }
      )
    }

    // 安全檢查 2：防止路徑遍歷
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
      console.warn('安全警告：檢測到路徑遍歷嘗試:', folderInput)
      return NextResponse.json(
        { error: '無效的上傳目錄' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的圖片' },
        { status: 400 }
      )
    }

    // 驗證文件類型（移除 SVG 支援，防止 XSS）
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '僅支援 JPG、PNG、WebP 格式的圖片（基於安全考量不支援 SVG）' },
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

    // 獲取並驗證文件擴展名
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: '不支援的檔案格式' },
        { status: 400 }
      )
    }

    // 生成唯一文件名：timestamp_random.ext（只使用安全字符）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}_${randomStr}${ext}`

    // 確保上傳目錄存在
    const uploadsBase = path.resolve(process.cwd(), 'public', 'uploads')
    const uploadDir = path.resolve(uploadsBase, folder)

    // 安全檢查 3：再次確認路徑在允許範圍內
    if (!uploadDir.startsWith(uploadsBase)) {
      console.warn('安全警告：路徑逃逸嘗試')
      return NextResponse.json(
        { error: '無效的上傳目錄' },
        { status: 400 }
      )
    }

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
    const fileUrl = `/uploads/${folder}/${fileName}`

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
