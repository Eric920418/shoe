/**
 * 安全防護工具函數
 */

// Rate Limiting快取（簡易版，生產環境建議使用Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * API請求頻率限制
 * @param identifier - 标识符（IP地址或用户ID）
 * @param maxRequests - 最大請求數
 * @param windowMs - 時間窗口（毫秒）
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1分鐘
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // 清理過期記錄
  if (record && now > record.resetTime) {
    rateLimitMap.delete(identifier)
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * 清理HTML標籤，防止XSS攻擊
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * 清理SQL輸入（Prisma已經處理了，這是額外保護）
 */
export function sanitizeSql(input: string): string {
  if (!input) return ''
  // 移除常見的SQL注入嘗試
  return input
    .replace(/('|(--)|;|\/\*|\*\/|xp_|sp_|exec|execute|insert|update|delete|drop|create|alter)/gi, '')
    .trim()
}

/**
 * 驗證郵箱格式（加強版）
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 255) return false

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * 驗證密碼強度（加強版）
 * 要求：至少8個字符，包含大小写字母、數字
 */
export function isStrongPassword(password: string): boolean {
  if (!password || password.length < 8 || password.length > 128) return false

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return hasUpperCase && hasLowerCase && hasNumber
}

/**
 * 驗證手機號碼（台灣格式）
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  const phoneRegex = /^09\d{8}$/
  return phoneRegex.test(phone)
}

/**
 * 生成安全的隨機字符串
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues)
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length]
    }
  } else {
    // Fallback（不推薦用於生產環境）
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }

  return result
}

/**
 * 驗證檔案上傳（圖片）
 */
export function validateImageUpload(file: { size: number; type: string }): {
  valid: boolean
  error?: string
} {
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: '圖片大小不能超過5MB',
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '只允許上傳JPG、PNG、WebP、GIF格式的圖片',
    }
  }

  return { valid: true }
}

/**
 * 防止時序攻擊的字串比較
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * 檢查是否為管理員
 */
export function isAdmin(user?: { role: string } | null): boolean {
  return user?.role === 'ADMIN'
}

/**
 * @deprecated 使用 isAdmin 代替
 */
export function isOperatorOrAdmin(user?: { role: string } | null): boolean {
  return isAdmin(user)
}

/**
 * 日誌記錄敏感操作（生產環境應該寫入資料庫或日誌檔案）
 */
export function logSecurityEvent(
  event: string,
  userId?: string,
  details?: Record<string, any>
): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    userId,
    details,
  }

  // 開發環境：輸出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY]', logEntry)
  }

  // 生產環境：這裡應該寫入日誌系統
  // TODO: 整合日誌系統（例如：Winston, Pino等）
}
