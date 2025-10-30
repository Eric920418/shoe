/**
 * 郵件發送工具
 * 使用 Nodemailer 發送 SMTP 郵件
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

// SMTP 配置（從環境變數讀取）
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

// 發件人配置
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@shoestore.com'
const FROM_NAME = process.env.SMTP_FROM_NAME || '鞋店電商'

let transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null

/**
 * 獲取郵件發送器實例（單例模式）
 */
function getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
  if (!transporter) {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      throw new Error(
        'SMTP 配置缺失：請在環境變數中設定 SMTP_USER 和 SMTP_PASSWORD'
      )
    }

    transporter = nodemailer.createTransport(SMTP_CONFIG)
  }
  return transporter
}

/**
 * 發送單封郵件
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const emailTransporter = getTransporter()

    const info = await emailTransporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // 移除 HTML 標籤作為備用純文字
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error(`郵件發送失敗 (收件人: ${options.to}):`, error)
    return {
      success: false,
      error: error.message || '未知錯誤',
    }
  }
}

/**
 * 批量發送郵件（帶延遲，避免觸發 SMTP 限制）
 */
export async function sendBulkEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
    text?: string
  }>,
  options?: {
    delayBetweenEmails?: number // 每封郵件之間的延遲（毫秒），預設 1000ms
    onProgress?: (sent: number, total: number) => void
  }
): Promise<{
  totalSent: number
  totalFailed: number
  results: Array<{ email: string; success: boolean; error?: string }>
}> {
  const delay = options?.delayBetweenEmails || 1000
  const results: Array<{ email: string; success: boolean; error?: string }> = []
  let totalSent = 0
  let totalFailed = 0

  for (let i = 0; i < emails.length; i++) {
    const emailData = emails[i]

    const result = await sendEmail(emailData)

    results.push({
      email: emailData.to,
      success: result.success,
      error: result.error,
    })

    if (result.success) {
      totalSent++
    } else {
      totalFailed++
    }

    // 執行進度回調
    if (options?.onProgress) {
      options.onProgress(i + 1, emails.length)
    }

    // 添加延遲（最後一封郵件不需要延遲）
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return { totalSent, totalFailed, results }
}

/**
 * 生成退訂連結
 */
export function generateUnsubscribeLink(unsubscribeToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/unsubscribe/${unsubscribeToken}`
}

/**
 * 生成郵件 HTML 模板（包含退訂連結）
 */
export function generateEmailTemplate(options: {
  title: string
  content: string
  unsubscribeToken?: string
}): string {
  const unsubscribeLink = options.unsubscribeToken
    ? generateUnsubscribeLink(options.unsubscribeToken)
    : null

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: 'Arial', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #007bff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      font-size: 16px;
      color: #555;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${FROM_NAME}</h1>
    </div>
    <div class="content">
      ${options.content}
    </div>
    ${
      unsubscribeLink
        ? `
    <div class="footer">
      <p>
        如果您不想再收到此類郵件，請
        <a href="${unsubscribeLink}">點擊此處取消訂閱</a>
      </p>
      <p>&copy; ${new Date().getFullYear()} ${FROM_NAME}. 保留所有權利。</p>
    </div>
    `
        : `
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${FROM_NAME}. 保留所有權利。</p>
    </div>
    `
    }
  </div>
</body>
</html>
  `.trim()
}

/**
 * 驗證郵件地址格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 測試 SMTP 連線
 */
export async function testSMTPConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const emailTransporter = getTransporter()
    await emailTransporter.verify()
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '未知錯誤',
    }
  }
}
