/**
 * LINE Login + Messaging API 整合
 *
 * 功能：
 * 1. LINE OAuth 登入
 * 2. 發送 OTP 驗證碼到 LINE
 * 3. 發送訂單通知、促銷訊息
 * 4. 自動邀請加入官方帳號好友
 */

import axios from 'axios'

// ============================================
// 環境變數配置
// ============================================

// LINE Login（OAuth）
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || ''
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''
const LINE_CALLBACK_URL = process.env.LINE_CALLBACK_URL || 'http://localhost:3000/auth/line-verify'

// LINE Messaging API（發送訊息）
const LINE_MESSAGING_ACCESS_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN || ''
const LINE_OFFICIAL_ACCOUNT_ID = process.env.LINE_OFFICIAL_ACCOUNT_ID || '' // 例如：@abc1234

// ============================================
// LINE Login（OAuth）
// ============================================

/**
 * 生成 LINE Login 授權 URL
 * 用戶點擊後會跳轉到 LINE 授權頁面
 *
 * 重要參數說明:
 * - bot_prompt=aggressive: 強制顯示「加入好友」提示
 * - prompt=consent: 每次都顯示授權同意畫面(即使已授權過)
 * - nonce: 防止重放攻擊,每次都生成新的
 */
export function generateLineLoginUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_CALLBACK_URL,
    state: state || generateRandomState(),
    scope: 'profile openid', // 取得用戶資料
    nonce: generateRandomNonce(), // 每次生成新的 nonce
    bot_prompt: 'aggressive', // 積極提示加入好友(normal = 普通提示, aggressive = 強制提示)
    prompt: 'consent', // 每次都顯示授權同意畫面
  })

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
}

/**
 * 使用授權碼換取 Access Token
 */
export async function getLineAccessToken(code: string): Promise<{
  access_token: string
  id_token: string
  expires_in: number
  refresh_token: string
  token_type: string
}> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINE_CALLBACK_URL,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  })

  try {
    const response = await axios.post('https://api.line.me/oauth2/v2.1/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data
  } catch (error: any) {
    console.error('LINE getLineAccessToken 錯誤:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code,
      redirect_uri: LINE_CALLBACK_URL,
      client_id: LINE_CHANNEL_ID,
    })
    throw new Error(`LINE API 錯誤: ${error.response?.data?.error_description || error.message}`)
  }
}

/**
 * 使用 Access Token 取得用戶資料
 */
export async function getLineProfile(accessToken: string): Promise<{
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}> {
  const response = await axios.get('https://api.line.me/v2/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.data
}

/**
 * 驗證 ID Token（可選，用於更嚴格的驗證）
 */
export async function verifyIdToken(idToken: string): Promise<{
  sub: string // LINE User ID
  name: string
  picture: string
}> {
  const params = new URLSearchParams({
    id_token: idToken,
    client_id: LINE_CHANNEL_ID,
  })

  const response = await axios.post('https://api.line.me/oauth2/v2.1/verify', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return response.data
}

// ============================================
// LINE Messaging API（發送訊息）
// ============================================

/**
 * 發送歡迎訊息 + 邀請加入官方帳號
 */
export async function sendWelcomeMessage(lineUserId: string, userName: string): Promise<void> {
  if (!LINE_MESSAGING_ACCESS_TOKEN) {
    throw new Error('LINE_MESSAGING_ACCESS_TOKEN 未設定')
  }

  const messages = [
    {
      type: 'text',
      text: `👋 歡迎 ${userName}！\n\n感謝您註冊潮流鞋店！`,
    },
    {
      type: 'text',
      text: `🎁 加入我們的官方帳號好友，即可接收：\n\n✅ 訂單狀態通知\n✅ 專屬優惠活動\n✅ 新品上市資訊\n\n立即加入 👇`,
    },
    {
      type: 'template',
      altText: '加入官方帳號好友',
      template: {
        type: 'buttons',
        text: '點擊下方按鈕加入好友',
        actions: [
          {
            type: 'uri',
            label: '加入好友',
            uri: `https://line.me/R/ti/p/${LINE_OFFICIAL_ACCOUNT_ID}`,
          },
        ],
      },
    },
  ]

  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    {
      to: lineUserId,
      messages,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_MESSAGING_ACCESS_TOKEN}`,
      },
    }
  )
}

/**
 * 發送訂單通知（未來使用）
 */
export async function sendOrderNotification(
  lineUserId: string,
  orderNumber: string,
  status: string,
  totalAmount: number
): Promise<void> {
  if (!LINE_MESSAGING_ACCESS_TOKEN) {
    return // 如果沒有設定，靜默失敗
  }

  const statusText = {
    PENDING: '⏳ 待付款',
    PAID: '✅ 已付款',
    PROCESSING: '📦 處理中',
    SHIPPED: '🚚 已出貨',
    DELIVERED: '✅ 已送達',
    CANCELLED: '❌ 已取消',
  }[status] || status

  const message = {
    type: 'text',
    text: `📦 訂單狀態更新\n\n訂單編號：${orderNumber}\n狀態：${statusText}\n金額：NT$ ${totalAmount.toLocaleString()}\n\n感謝您的購買！`,
  }

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: lineUserId,
        messages: [message],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LINE_MESSAGING_ACCESS_TOKEN}`,
        },
      }
    )
  } catch (error) {
    console.error('發送 LINE 通知失敗:', error)
    // 不拋出錯誤，避免影響主要業務流程
  }
}

// ============================================
// 工具函數
// ============================================

/**
 * 生成隨機 state（防 CSRF 攻擊）
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 生成隨機 nonce（防重放攻擊）
 */
function generateRandomNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}


/**
 * 檢查是否已設定 LINE Messaging API
 */
export function isLineMessagingEnabled(): boolean {
  return !!LINE_MESSAGING_ACCESS_TOKEN
}

/**
 * 檢查是否已設定 LINE Login
 */
export function isLineLoginEnabled(): boolean {
  return !!LINE_CHANNEL_ID && !!LINE_CHANNEL_SECRET
}
