/**
 * Cloudflare R2 客戶端配置
 * R2 使用 S3 相容 API
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// 檢查必要的環境變數
function validateR2Config() {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`缺少 R2 配置環境變數: ${missing.join(', ')}`)
  }
}

// 創建 R2 客戶端（懶加載）
let r2Client: S3Client | null = null

export function getR2Client(): S3Client {
  if (!r2Client) {
    validateR2Config()

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return r2Client
}

export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME!
}

// 獲取公開 URL（需要在 R2 設定自訂域名或使用 r2.dev）
export function getPublicUrl(key: string): string {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN
  if (publicDomain) {
    return `https://${publicDomain}/${key}`
  }
  // 如果沒有自訂域名，使用 r2.dev 公開訪問（需要在 R2 控制台開啟）
  return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`
}

/**
 * 上傳檔案到 R2
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client()
  const bucket = getBucketName()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await client.send(command)
  return getPublicUrl(key)
}

/**
 * 從 R2 刪除檔案
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client()
  const bucket = getBucketName()

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  await client.send(command)
}

/**
 * 從 URL 提取 R2 key
 */
export function extractKeyFromUrl(url: string): string | null {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN

  if (publicDomain && url.includes(publicDomain)) {
    const match = url.match(new RegExp(`https?://${publicDomain}/(.+)`))
    return match ? match[1] : null
  }

  // r2.dev 格式
  const r2DevMatch = url.match(/r2\.dev\/(.+)/)
  return r2DevMatch ? r2DevMatch[1] : null
}
