/**
 * 物流 API 工具函數
 * 藍新金流物流服務串接
 */

import crypto from 'crypto'

// ============================================
// 物流狀態代碼對應表
// ============================================

/**
 * 藍新物流狀態代碼對應說明
 *
 * === 即時通知 (LgsState) ===
 * 統一 7-ELEVEN (ShipType=1):
 *   0: 建單成功
 *   3: 正在配送中
 *   4: 已送達取貨門市
 *   5: 已取件
 *   6: 包裹退回原寄超商
 *   9: 包裹被退回
 *
 * 全家 FamilyMart (ShipType=2):
 *   0: 建單成功
 *   3: 已寄件
 *   4: 到店
 *   5: 取件完成
 *   9: 異常
 *
 * OK Mart (ShipType=4):
 *   0: 建單成功
 *   3: 已寄件
 *   4: 到店
 *   5: 取件完成
 *   9: 異常
 *
 * === queryShipment API 回傳 (RetId) ===
 * 與即時通知的 LgsState 不同，queryShipment 使用 RetId：
 *   0_1: 訂單未處理
 *   1: 訂單處理中
 *   5: 商品送達取貨門市
 *   6: 買家取貨完成
 *   7: 退貨
 *   8: 轉店
 */

export const LOGISTICS_STATE_MESSAGES: Record<string, Record<string, string>> = {
  // 統一 7-ELEVEN
  '1': {
    '0': '建單成功',
    '3': '正在配送中',
    '4': '已送達取貨門市',
    '5': '已取件',
    '6': '包裹退回原寄超商',
    '9': '包裹被退回',
  },
  // 全家
  '2': {
    '0': '建單成功',
    '3': '已寄件',
    '4': '到店',
    '5': '取件完成',
    '9': '異常',
  },
  // OK
  '4': {
    '0': '建單成功',
    '3': '已寄件',
    '4': '到店',
    '5': '取件完成',
    '9': '異常',
  },
}

/**
 * queryShipment API 回傳的 RetId 狀態訊息
 * 這是查詢 API 專用的狀態格式，與即時通知的 LgsState 不同
 */
export const RET_ID_MESSAGES: Record<string, string> = {
  '0_1': '訂單未處理',
  '1': '訂單處理中',
  '5': '商品送達取貨門市',
  '6': '買家取貨完成',
  '7': '退貨',
  '8': '轉店',
}

/**
 * 將 queryShipment API 的 RetId 轉換為系統 ShippingStatus
 * @param retId queryShipment 回傳的 RetId
 * @returns 系統物流狀態
 */
export function mapRetIdToShippingStatus(
  retId: string
): 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' {
  switch (retId) {
    case '0_1': // 訂單未處理
      return 'PENDING'
    case '1': // 訂單處理中
      return 'PROCESSING'
    case '5': // 商品送達取貨門市
      return 'SHIPPED'
    case '6': // 買家取貨完成
      return 'DELIVERED'
    case '7': // 退貨
    case '8': // 轉店
      return 'SHIPPED' // 異常狀態保持 SHIPPED，需要人工處理
    default:
      return 'PROCESSING'
  }
}

/**
 * 將 queryShipment API 的 RetId 轉換為系統 OrderStatus
 * @param retId queryShipment 回傳的 RetId
 * @returns 系統訂單狀態（僅在取件完成時更新）
 */
export function mapRetIdToOrderStatus(
  retId: string
): 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | null {
  switch (retId) {
    case '0_1': // 訂單未處理
      return 'PROCESSING'
    case '1': // 訂單處理中
      return 'PROCESSING'
    case '5': // 商品送達取貨門市
      return 'SHIPPED'
    case '6': // 買家取貨完成 - 訂單完成
      return 'COMPLETED'
    default:
      return null // 不更新訂單狀態
  }
}

/**
 * 取得 RetId 的中文說明
 */
export function getRetIdMessage(retId: string): string {
  return RET_ID_MESSAGES[retId] || `未知狀態 (${retId})`
}

/**
 * 將藍新物流狀態轉換為系統 ShippingStatus
 * @param lgsState 藍新物流狀態代碼
 * @param shipType 物流廠商類型
 * @returns 系統物流狀態
 */
export function mapLgsStateToShippingStatus(
  lgsState: string,
  shipType: string
): 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' {
  // 統一處理所有廠商的狀態對應
  switch (lgsState) {
    case '0': // 建單成功
      return 'PROCESSING'
    case '3': // 配送中/已寄件
      return 'SHIPPED'
    case '4': // 到店
      return 'SHIPPED' // 到店但未取貨，仍視為已出貨狀態
    case '5': // 已取件/取件完成
      return 'DELIVERED'
    case '6': // 退回原寄（7-ELEVEN 專用）
    case '9': // 異常/被退回
      // 異常狀態保持 SHIPPED，需要人工處理
      return 'SHIPPED'
    default:
      return 'PROCESSING'
  }
}

/**
 * 將藍新物流狀態轉換為系統 OrderStatus
 * @param lgsState 藍新物流狀態代碼
 * @returns 系統訂單狀態（僅在取件完成時更新）
 */
export function mapLgsStateToOrderStatus(
  lgsState: string
): 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | null {
  switch (lgsState) {
    case '0': // 建單成功
      return 'PROCESSING'
    case '3': // 配送中/已寄件
      return 'SHIPPED'
    case '4': // 到店
      return 'SHIPPED'
    case '5': // 已取件 - 訂單完成
      return 'COMPLETED'
    default:
      return null // 不更新訂單狀態
  }
}

/**
 * 取得物流狀態的中文說明
 */
export function getLgsStateMessage(lgsState: string, shipType: string): string {
  const messages = LOGISTICS_STATE_MESSAGES[shipType]
  if (messages && messages[lgsState]) {
    return messages[lgsState]
  }
  return `未知狀態 (${lgsState})`
}

/**
 * 驗證物流通知的 HashData
 */
export function verifyLogisticsHash(encryptedData: string, receivedHash: string): boolean {
  const expectedHash = generateLogisticsHash(encryptedData)
  const isValid = expectedHash === receivedHash.toUpperCase()

  if (!isValid) {
    console.error('物流 Hash 驗證失敗:')
    console.error('- 計算值:', expectedHash.substring(0, 20) + '...')
    console.error('- 接收值:', receivedHash.toUpperCase().substring(0, 20) + '...')
  }

  return isValid
}

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
 * 重要：藍新金流物流 API 使用 OPENSSL_ZERO_PADDING，需要手動移除 PKCS7 padding
 * 參考：物流服務技術串接手冊 PHP 範例的 create_aes_decrypt + strippadding 函數
 */
export function decryptLogisticsData(encryptedData: string): Record<string, any> {
  const { key, iv } = getLogisticsKeyIv()

  // 將 hex 字串轉為 Buffer
  const encrypted = Buffer.from(encryptedData, 'hex')

  // 使用 AES-256-CBC 解密，關閉自動 padding（相當於 PHP 的 OPENSSL_ZERO_PADDING）
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  decipher.setAutoPadding(false)
  let decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

  // 手動移除 PKCS7 padding（和 PHP 的 strippadding 函數一樣）
  const padLen = decrypted[decrypted.length - 1]
  if (padLen > 0 && padLen <= 32) {
    // 驗證 padding 是否正確（所有 padding bytes 應該相同）
    let validPadding = true
    const startIdx = Math.max(0, decrypted.length - padLen)
    for (let i = startIdx; i < decrypted.length; i++) {
      if (decrypted[i] !== padLen) {
        validPadding = false
        break
      }
    }
    if (validPadding) {
      decrypted = decrypted.slice(0, -padLen)
    }
  }

  // 轉為字串並移除可能殘留的控制字符
  let str = decrypted.toString('utf8')
  str = str.replace(/[\x00-\x1F]+$/, '')

  return JSON.parse(str)
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
    '4': 10, // OK
  },
  // B2C 模式限制（更嚴格）
  'B2C': {
    '1': 1,  // 統一
    '2': 1,  // 全家（B2C 模式只能一次列印 1 筆）
    '4': 1,  // OK
  },
}

/**
 * 列印物流標籤（取得列印網址）
 * @param orderNumbers 商店訂單編號陣列
 * @param shipType 物流廠商類型：1=統一, 2=全家, 4=OK
 *
 * ⚠️ 注意：同一批列印的訂單必須是同一個物流廠商
 */
export async function printLogisticsLabel(
  orderNumbers: string[],
  shipType: '1' | '2' | '4' = '1'
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

  console.log(`列印物流標籤：ShipType=${shipType} (1=統一, 2=全家, 4=OK)`)

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
 * @returns ShipType: 1=統一(7-ELEVEN), 2=全家, 4=OK
 */
export function getShipTypeByStoreName(storeName: string): '1' | '2' | '4' {
  const name = storeName.toLowerCase()
  if (name.includes('全家') || name.includes('familymart')) {
    return '2' // 全家
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
  shipType?: '1' | '2' | '4' // 物流廠商：1=統一, 2=全家, 4=OK
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
    ShipType: shipType,                       // 物流廠商：1=統一，2=全家，4=OK
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

/**
 * 取得寄件代碼（讓管理員到超商機台輸入印出標籤）
 * 參考：物流服務技術串接手冊 - getShipmentNo (NPA-B53)
 * @param merchantOrderNos 商店訂單編號陣列（最多 10 筆）
 */
export async function getShipmentNo(merchantOrderNos: string[]): Promise<{
  Status: string
  Message: string
  Results?: Array<{
    MerchantOrderNo: string
    ShipmentNo: string  // 寄件代碼
    ShipType: string
    Status: string
  }>
}> {
  const { apiUrl, merchantId, hashKey, hashIV } = LOGISTICS_CONFIG

  // 檢查必要參數
  if (!merchantId || !hashKey || !hashIV) {
    throw new Error('物流 API 配置不完整，請檢查環境變數')
  }

  if (!merchantOrderNos.length) {
    throw new Error('merchantOrderNos 不可為空')
  }

  if (merchantOrderNos.length > 10) {
    throw new Error('一次最多只能查詢 10 筆訂單的寄件代碼')
  }

  // 準備內層加密參數
  const encryptParams = {
    MerchantOrderNo: merchantOrderNos,  // 陣列格式
    Version: '1.0',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    RespondType: 'JSON',
  }

  console.log('=== getShipmentNo 加密前參數 ===')
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
  const response = await fetch(`${apiUrl}/getShipmentNo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const responseText = await response.text()
  console.log('getShipmentNo API 回應:', responseText)

  let result: any
  try {
    result = JSON.parse(responseText)
  } catch (e) {
    throw new Error(`物流 API 回應格式錯誤: ${responseText}`)
  }

  if (result.Status !== 'SUCCESS') {
    throw new Error(`取得寄件代碼失敗: ${result.Message || '未知錯誤'}`)
  }

  // 解密回傳資料
  if (result.EncryptData) {
    const decryptedData = decryptLogisticsData(result.EncryptData)
    console.log('解密後的資料:', JSON.stringify(decryptedData, null, 2))

    // 藍新回傳格式：{ SUCCESS: [...], ERROR: [...] }
    // StorePrintNo 是寄件代碼（到超商機台輸入的）
    const successItems = decryptedData.SUCCESS || []
    const results = successItems.map((item: any) => ({
      MerchantOrderNo: item.MerchantOrderNo,
      ShipmentNo: item.StorePrintNo || item.LgsNo,  // 寄件代碼
      ShipType: item.ShipType,
      LgsType: item.LgsType,
      Status: item.ErrorCode,
    }))

    return {
      Status: result.Status,
      Message: result.Message,
      Results: results,
    }
  }

  return result
}
