/**
 * 媒體上傳 API（圖片 + 影片）
 *
 * 生產環境：使用 Cloudflare R2
 * 開發環境：使用本地 /public/uploads 資料夾
 *
 * 支援格式：
 * - 圖片：JPG、PNG、WebP（最大 5MB）
 * - 影片：MP4、WebM（最大 50MB）
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
import { uploadToR2 } from '@/lib/r2'

// 允許上傳的資料夾白名單
const ALLOWED_FOLDERS = ['products', 'brands', 'categories', 'banners', 'avatars', 'reviews', 'returns', 'hero', 'payments']

// 允許的圖片類型（移除 SVG 防止 XSS）
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// 允許的影片類型
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']

// 所有允許的檔案類型
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

// 允許的圖片副檔名
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// 允許的影片副檔名
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm']

// 所有允許的副檔名
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]

// 檔案大小限制
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

// 判斷是否為影片類型
const isVideoType = (mimeType: string) => ALLOWED_VIDEO_TYPES.includes(mimeType)

// 是否使用 R2（生產環境）
const useR2 = () => {
  return process.env.NODE_ENV === 'production' || process.env.USE_R2 === 'true'
}

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
        { error: '僅支援 JPG、PNG、WebP 格式的圖片，以及 MP4、WebM 格式的影片' },
        { status: 400 }
      )
    }

    // 根據文件類型決定大小限制
    const isVideo = isVideoType(file.type)
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    const sizeLabel = isVideo ? '50MB' : '5MB'
    const typeLabel = isVideo ? '影片' : '圖片'

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `${typeLabel}大小不能超過 ${sizeLabel}` },
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

    // 將文件轉換為 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let fileUrl: string

    if (useR2()) {
      // 生產環境：上傳到 R2
      const key = `uploads/${folder}/${fileName}`
      fileUrl = await uploadToR2(buffer, key, file.type)
    } else {
      // 開發環境：儲存到本地
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

      // 保存文件
      const filePath = path.join(uploadDir, fileName)
      await writeFile(filePath, buffer)

      fileUrl = `/uploads/${folder}/${fileName}`
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      size: file.size,
      type: file.type,
      isVideo,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    console.error('媒體上傳失敗:', error)
    return NextResponse.json(
      { error: `上傳失敗：${errorMessage}` },
      { status: 500 }
    )
  }
}
