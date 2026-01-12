/**
 * 物流 API 工具函數
 * 藍新金流物流服務串接
 */

import crypto from 'crypto'

// 物流 API 配置
const LOGISTICS_CONFIG = {
  // 物流 API 使用 ccore 而非 core
  apiUrl:
    process.env.NEWEBPAY_LOGISTICS_API_URL || "https://core.newebpay.com/API/Logistic",
  // 物流可能有專屬的 MerchantID，如果沒有就用金流的
  merchantId:
    process.env.NEWEBPAY_LOGISTICS_MERCHANT_ID ||
    process.env.NEWEBPAY_MERCHANT_ID ||
    "",
  // 物流可能有專屬的 Key 和 IV，如果沒有就用金流的
  hashKey:
    process.env.NEWEBPAY_LOGISTICS_HASH_KEY ||
    process.env.NEWEBPAY_HASH_KEY ||
    "",
  hashIV:
    process.env.NEWEBPAY_LOGISTICS_HASH_IV ||
    process.env.NEWEBPAY_HASH_IV ||
    "",
};

/**
 * 取得並驗證物流 Key 和 IV
 * 確保長度正確：Key 必須 32 bytes，IV 必須 16 bytes
 */
function getLogisticsKeyIv() {
  const key = Buffer.from(LOGISTICS_CONFIG.hashKey, 'utf8')
  const iv = Buffer.from(LOGISTICS_CONFIG.hashIV, 'utf8')

  if (key.length !== 32) {
    throw new Error(`物流 HashKey 長度錯誤：${key.length}，應為 32`)
  }
  if (iv.length !== 16) {
    throw new Error(`物流 HashIV 長度錯誤：${iv.length}，應為 16`)
  }

  return { key, iv }
}

/**
 * AES-256-CBC 加密
 */
export function encryptLogisticsData(data: Record<string, any>): string {
  const { key, iv } = getLogisticsKeyIv()

  // 將資料轉為 JSON 字串
  const jsonData = JSON.stringify(data)

  // 使用 AES-256-CBC 加密
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(jsonData, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

/**
 * AES-256-CBC 解密
 */
export function decryptLogisticsData(encryptedData: string): Record<string, any> {
  const { key, iv } = getLogisticsKeyIv()

  // 使用 AES-256-CBC 解密
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}

/**
 * 產生 SHA256 雜湊值
 */
export function generateLogisticsHash(encryptedData: string): string {
  const { hashKey, hashIV } = LOGISTICS_CONFIG

  // HashKey + 加密資料 + HashIV
  const hashString = `HashKey=${hashKey}&${encryptedData}&HashIV=${hashIV}`

  // SHA256 雜湊並轉為大寫
  return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase()
}

/**
 * 每個物流廠商限制一次可列印的標籤數量（參考《物流服務技術串接手冊》）
 * 注意：C2C 和 B2C 的限制不同
 */
const PRINT_LABEL_LIMITS: Record<string, Record<string, number>> = {
  // C2C 模式限制
  'C2C': {
    '1': 10, // 統一
    '2': 8,  // 全家（官方文件指出 C2C 限制 8 筆 / A4 兩張）
    '3': 10, // 萊爾富
    '4': 10, // OK
  },
  // B2C 模式限制（更嚴格）
  'B2C': {
    '1': 1,  // 統一
    '2': 1,  // 全家（B2C 模式只能一次列印 1 筆）
    '3': 1,  // 萊爾富
    '4': 1,  // OK
  },
}

/**
 * 列印物流標籤（取得列印網址）
 * @param orderNumbers 商店訂單編號陣列
 * @param shipType 物流廠商類型：1=統一, 2=全家, 3=萊爾富, 4=OK
 *
 * ⚠️ 注意：同一批列印的訂單必須是同一個物流廠商
 */
export async function printLogisticsLabel(
  orderNumbers: string[],
  shipType: '1' | '2' | '3' | '4' = '1'
): Promise<any> {
  const { apiUrl, merchantId, hashKey, hashIV } = LOGISTICS_CONFIG

  // 檢查必要參數
  if (!merchantId || !hashKey || !hashIV) {
    throw new Error('物流 API 配置不完整，請檢查環境變數 NEWEBPAY_MERCHANT_ID, NEWEBPAY_HASH_KEY, NEWEBPAY_HASH_IV')
  }

  if (!orderNumbers.length) {
    throw new Error('orderNumbers 不可為空')
  }

  // C2C（店到店）模式
  const lgsType: 'C2C' = 'C2C'

  // ✅ MerchantOrderNo 必須是陣列格式（即使只有一筆）
  const merchantOrderNo = orderNumbers

  console.log(`列印物流標籤：ShipType=${shipType} (1=統一, 2=全家, 3=萊爾富, 4=OK)`)

  const encryptParams: Record<string, any> = {
    LgsType: lgsType,
    ShipType: shipType, // ✅ 動態指定物流廠商
    MerchantOrderNo: merchantOrderNo, // ✅ 陣列格式（藍新 API 要求）
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
  }

  console.log('=== printLabel 加密前參數 ===')
  console.log(JSON.stringify(encryptParams, null, 2))

  const encryptedData = encryptLogisticsData(encryptParams)
  const hashData = generateLogisticsHash(encryptedData)

  const formData = new URLSearchParams({
    UID_: merchantId,
    Version_: '1.0',
    RespondType_: 'JSON',
    EncryptData_: encryptedData,
    HashData_: hashData,
  })

  // ✅ 使用正確的 API：printLabel（取得列印頁面網址）
  const response = await fetch(`${apiUrl}/printLabel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const responseText = await response.text()
  console.log('printLabel API 回應:', responseText)

  const trimmed = responseText.trim()

  // 成功時會回傳：<script>location.href='...Logistic_print/view/xxxx'</script>
  if (trimmed.startsWith('<script')) {
    const match = trimmed.match(/location\.href=['"]([^'"]+)['"]/)
    if (!match) {
      throw new Error(`無法解析物流標籤網址: ${responseText}`)
    }

    const printUrl = match[1]
    console.log('✅ 成功解析出列印網址:', printUrl)

    return {
      Status: 'SUCCESS',
      Message: 'PRINT_REDIRECT',
      PrintUrl: printUrl,
    }
  }

  // 錯誤時會回傳 JSON
  let result: any
  try {
    result = JSON.parse(trimmed)
  } catch (e) {
    throw new Error(`物流 API 回應格式錯誤: ${responseText}`)
  }

  if (result.Status !== 'SUCCESS') {
    throw new Error(`列印標籤失敗: ${result.Message || '未知錯誤'}`)
  }

  // 萬一某些情況下 SUCCESS 但沒有 script，就直接把結果丟回去讓上層自己處理
  return result
}

/**
 * 根據門市名稱判斷物流廠商類型
 * @param storeName 門市名稱
 * @returns ShipType: 1=統一(7-ELEVEN), 2=全家, 3=萊爾富, 4=OK
 */
export function getShipTypeByStoreName(storeName: string): '1' | '2' | '3' | '4' {
  const name = storeName.toLowerCase()
  if (name.includes('全家') || name.includes('familymart')) {
    return '2' // 全家
  }
  if (name.includes('萊爾富') || name.includes('hilife')) {
    return '3' // 萊爾富
  }
  if (name.includes('ok') || name.includes('okmart')) {
    return '4' // OK
  }
  // 預設為 7-ELEVEN
  return '1'
}

/**
 * 建立物流配送單
 * 參考：物流服務技術串接手冊 - createShipment (NPA-B52)
 * @param orderData 訂單資料
 */
export async function createShipment(orderData: {
  merchantOrderNo: string   // 商店訂單編號（必填，最長30字）
  userName: string          // 取件人姓名（必填，最長20字）
  userTel: string           // 取件人手機號碼（必填，最長10字）
  userEmail: string         // 取件人電子信箱（必填，最長50字）
  storeId: string           // 超商門市代碼（必填，最長10字）
  amt: number               // 訂單金額（必填）
  itemDesc?: string         // 產品名稱說明（選填，最長100字）
  shipType?: '1' | '2' | '3' | '4' // 物流廠商：1=統一, 2=全家, 3=萊爾富, 4=OK
  storeName?: string        // 門市名稱（僅用於判斷 shipType）
}): Promise<any> {
  const { apiUrl, merchantId, hashKey, hashIV } = LOGISTICS_CONFIG

  // 檢查必要參數
  if (!merchantId || !hashKey || !hashIV) {
    throw new Error('物流 API 配置不完整，請檢查環境變數')
  }

  // 自動根據門市名稱判斷物流廠商（如果沒有傳入 shipType）
  const shipType = orderData.shipType || getShipTypeByStoreName(orderData.storeName || '')
  console.log(`物流廠商判斷：門市名稱="${orderData.storeName}" → ShipType=${shipType}`)

  // 準備內層加密參數（參考技術手冊 NPA-B52）
  const encryptParams = {
    // === 必填欄位 ===
    LgsType: 'C2C',                           // 物流類別：C2C 店到店
    TradeType: '3',                           // 取貨類別：1=取貨付款，3=取貨不付款
    ShipType: shipType,                       // 物流廠商：1=統一，2=全家，3=萊爾富，4=OK
    MerchantOrderNo: orderData.merchantOrderNo, // 商店訂單編號
    Amt: orderData.amt.toString(),            // 訂單金額
    Version: '1.0',                           // 串接程式版本（固定 1.0）
    TimeStamp: Math.floor(Date.now() / 1000).toString(), // 時間戳記
    RespondType: 'JSON',                      // 回傳格式
    UserName: orderData.userName,             // 取件人姓名
    UserTel: orderData.userTel,               // 取件人手機號碼
    UserEmail: orderData.userEmail,           // 取件人電子信箱
    StoreID: orderData.storeId,               // 超商門市代碼
    // === 選填欄位 ===
    ...(orderData.itemDesc && { ItemDesc: orderData.itemDesc }), // 產品名稱說明
  }

  console.log('=== createShipment 加密前參數 ===')
  console.log(JSON.stringify(encryptParams, null, 2))

  // 加密資料
  const encryptedData = encryptLogisticsData(encryptParams)

  // 產生雜湊值
  const hashData = generateLogisticsHash(encryptedData)

  // 組裝外層表單參數
  const formData = new URLSearchParams({
    UID_: merchantId,
    Version_: '1.0',
    RespondType_: 'JSON',
    EncryptData_: encryptedData,
    HashData_: hashData,
  })

  // 發送 API 請求
  const response = await fetch(`${apiUrl}/createShipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    throw new Error(`物流 API 請求失敗: ${response.statusText}`)
  }

  const result = await response.json()

  // 檢查回傳狀態
  if (result.Status !== 'SUCCESS') {
    throw new Error(`建立配送單失敗: ${result.Message || '未知錯誤'}`)
  }

  return result
}

/**
 * 查詢物流配送單
 * @param merchantOrderNo 商店訂單編號
 */
export async function queryShipment(merchantOrderNo: string): Promise<any> {
  const { apiUrl, merchantId, hashKey, hashIV } = LOGISTICS_CONFIG

  // 檢查必要參數
  if (!merchantId || !hashKey || !hashIV) {
    throw new Error('物流 API 配置不完整，請檢查環境變數')
  }

  // 準備內層參數（只包含業務欄位）
  const encryptParams = {
    MerchantOrderNo: merchantOrderNo,
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
  }

  // 加密資料
  const encryptedData = encryptLogisticsData(encryptParams)

  // 產生雜湊值
  const hashData = generateLogisticsHash(encryptedData)

  // 組裝外層表單參數
  const formData = new URLSearchParams({
    UID_: merchantId,
    Version_: '1.0',
    RespondType_: 'JSON',
    EncryptData_: encryptedData,
    HashData_: hashData,
  })

  // 發送 API 請求
  const response = await fetch(`${apiUrl}/queryShipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    throw new Error(`物流 API 請求失敗: ${response.statusText}`)
  }

  const result = await response.json()

  return result
}
