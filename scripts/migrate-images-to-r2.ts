/**
 * 圖片遷移腳本 - 將本地圖片上傳到 R2 並更新資料庫 URL
 *
 * 使用方式：pnpm tsx scripts/migrate-images-to-r2.ts
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import { readFile, readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

const prisma = new PrismaClient()

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// 獲取 MIME 類型
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

// 上傳單個檔案到 R2
async function uploadFile(localPath: string, r2Key: string): Promise<string> {
  const buffer = await readFile(localPath)
  const ext = extname(localPath)
  const contentType = getMimeType(ext)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
  })

  await r2Client.send(command)
  return `https://${R2_PUBLIC_DOMAIN}/${r2Key}`
}

// 遞迴掃描目錄
async function scanDirectory(dir: string, baseDir: string): Promise<{ localPath: string; r2Key: string }[]> {
  const files: { localPath: string; r2Key: string }[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath, baseDir)
      files.push(...subFiles)
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase()
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
        const relativePath = fullPath.replace(baseDir, '').replace(/^\//, '')
        files.push({
          localPath: fullPath,
          r2Key: relativePath,
        })
      }
    }
  }

  return files
}

// 更新資料庫中的圖片 URL
async function updateDatabaseUrls(oldPrefix: string, newPrefix: string) {
  console.log('\n📦 更新資料庫中的圖片 URL...')

  // 更新產品圖片 (JSON 陣列)
  const products = await prisma.product.findMany({
    select: { id: true, images: true },
  })

  let productCount = 0
  for (const product of products) {
    const images = product.images as string[]
    if (Array.isArray(images) && images.length > 0) {
      const updatedImages = images.map((img: string) => {
        if (img.startsWith(oldPrefix)) {
          return img.replace(oldPrefix, newPrefix)
        }
        return img
      })

      if (JSON.stringify(images) !== JSON.stringify(updatedImages)) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: updatedImages },
        })
        productCount++
      }
    }
  }
  console.log(`  ✅ 更新了 ${productCount} 個產品的圖片`)

  // 更新產品變體顏色圖片
  const variants = await prisma.productVariant.findMany({
    where: { colorImage: { startsWith: oldPrefix } },
    select: { id: true, colorImage: true },
  })

  for (const variant of variants) {
    if (variant.colorImage) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { colorImage: variant.colorImage.replace(oldPrefix, newPrefix) },
      })
    }
  }
  console.log(`  ✅ 更新了 ${variants.length} 個變體的顏色圖片`)

  // 更新品牌 Logo
  const brands = await prisma.brand.findMany({
    where: { logo: { startsWith: oldPrefix } },
    select: { id: true, logo: true },
  })

  for (const brand of brands) {
    if (brand.logo) {
      await prisma.brand.update({
        where: { id: brand.id },
        data: { logo: brand.logo.replace(oldPrefix, newPrefix) },
      })
    }
  }
  console.log(`  ✅ 更新了 ${brands.length} 個品牌的 Logo`)

  // 更新分類圖片
  const categories = await prisma.category.findMany({
    where: { image: { startsWith: oldPrefix } },
    select: { id: true, image: true },
  })

  for (const category of categories) {
    if (category.image) {
      await prisma.category.update({
        where: { id: category.id },
        data: { image: category.image.replace(oldPrefix, newPrefix) },
      })
    }
  }
  console.log(`  ✅ 更新了 ${categories.length} 個分類的圖片`)

  // 更新 Hero Slides
  const heroSlides = await prisma.heroSlide.findMany({
    where: { image: { startsWith: oldPrefix } },
    select: { id: true, image: true },
  })

  for (const slide of heroSlides) {
    if (slide.image) {
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { image: slide.image.replace(oldPrefix, newPrefix) },
      })
    }
  }
  console.log(`  ✅ 更新了 ${heroSlides.length} 個輪播圖`)

  // 更新用戶頭像
  const users = await prisma.user.findMany({
    where: { avatar: { startsWith: oldPrefix } },
    select: { id: true, avatar: true },
  })

  for (const user of users) {
    if (user.avatar) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: user.avatar.replace(oldPrefix, newPrefix) },
      })
    }
  }
  console.log(`  ✅ 更新了 ${users.length} 個用戶頭像`)
}

async function main() {
  console.log('🚀 開始遷移圖片到 R2...\n')

  // 檢查配置
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_DOMAIN) {
    console.error('❌ 缺少 R2 配置，請檢查 .env 文件')
    process.exit(1)
  }

  console.log('📋 R2 配置:')
  console.log(`  Bucket: ${R2_BUCKET_NAME}`)
  console.log(`  Public Domain: ${R2_PUBLIC_DOMAIN}`)

  // 掃描本地圖片
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  console.log(`\n📂 掃描目錄: ${uploadsDir}`)

  let files: { localPath: string; r2Key: string }[] = []
  try {
    files = await scanDirectory(uploadsDir, join(process.cwd(), 'public'))
  } catch (error) {
    console.log('  ⚠️ uploads 目錄不存在或為空')
  }

  console.log(`  找到 ${files.length} 個圖片檔案`)

  if (files.length === 0) {
    console.log('\n⚠️ 沒有找到需要遷移的圖片，只更新資料庫 URL...')
  } else {
    // 上傳圖片
    console.log('\n📤 開始上傳圖片到 R2...')
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        await uploadFile(file.localPath, file.r2Key)
        successCount++
        process.stdout.write(`\r  進度: ${i + 1}/${files.length} (成功: ${successCount}, 失敗: ${failCount})`)
      } catch (error: any) {
        failCount++
        console.error(`\n  ❌ 上傳失敗: ${file.r2Key} - ${error.message}`)
      }
    }

    console.log(`\n  ✅ 上傳完成！成功: ${successCount}, 失敗: ${failCount}`)
  }

  // 更新資料庫 URL
  const oldPrefix = '/uploads/'
  const newPrefix = `https://${R2_PUBLIC_DOMAIN}/uploads/`
  await updateDatabaseUrls(oldPrefix, newPrefix)

  console.log('\n🎉 遷移完成！')
  console.log(`\n📌 新圖片 URL 格式: https://${R2_PUBLIC_DOMAIN}/uploads/...`)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ 遷移失敗:', error)
  prisma.$disconnect()
  process.exit(1)
})
