/**
 * 物流 API 工具函數
 * 藍新金流物流服務串接
 */

import crypto from 'crypto'

// 物流 API 配置
const LOGISTICS_CONFIG = {
  // 物流 API 使用 ccore 而非 core
  apiUrl: process.env.NEWEBPAY_LOGISTICS_API_URL || 'https://ccore.newebpay.com/API/Logistic',
  // 物流可能有專屬的 MerchantID，如果沒有就用金流的
  merchantId: process.env.NEWEBPAY_LOGISTICS_MERCHANT_ID || process.env.NEWEBPAY_MERCHANT_ID || '',
  // 物流可能有專屬的 Key 和 IV，如果沒有就用金流的
  hashKey: process.env.NEWEBPAY_LOGISTICS_HASH_KEY || process.env.NEWEBPAY_HASH_KEY || '',
  hashIV: process.env.NEWEBPAY_LOGISTICS_HASH_IV || process.env.NEWEBPAY_HASH_IV || '',
}

/**
 * AES-256-CBC 加密
 */
export function encryptLogisticsData(data: Record<string, any>): string {
  const { hashKey, hashIV } = LOGISTICS_CONFIG

  // 將資料轉為 JSON 字串
  const jsonData = JSON.stringify(data)

  // 使用 AES-256-CBC 加密
  const cipher = crypto.createCipheriv('aes-256-cbc', hashKey, hashIV)
  let encrypted = cipher.update(jsonData, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

/**
 * AES-256-CBC 解密
 */
export function decryptLogisticsData(encryptedData: string): Record<string, any> {
  const { hashKey, hashIV } = LOGISTICS_CONFIG

  // 使用 AES-256-CBC 解密
  const decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, hashIV)
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
 * 列印物流標籤
 * @param orderNumbers 商店訂單編號陣列（最多可一次列印多筆）
 * @param lgsType 物流類別（B2C 或 C2C）
 * @param shipType 物流廠商類別（1:統一，2:全家，3:萊爾富，4:OK）
 */
export async function printLogisticsLabel(
  orderNumbers: string[],
  lgsType: 'B2C' | 'C2C' = 'B2C',
  shipType: '1' | '2' | '3' | '4' = '2' // 預設全家
): Promise<any> {
  const { apiUrl, merchantId, hashKey, hashIV } = LOGISTICS_CONFIG

  // 檢查必要參數
  if (!merchantId || !hashKey || !hashIV) {
    throw new Error('物流 API 配置不完整，請檢查環境變數 NEWEBPAY_MERCHANT_ID, NEWEBPAY_HASH_KEY, NEWEBPAY_HASH_IV')
  }

  // 準備參數（注意：不要在加密資料中包含 UID_）
  const params: Record<string, any> = {
    LgsType: lgsType,
    ShipType: shipType,
    MerchantOrderNo: orderNumbers, // 陣列
    Version: '1.0',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    RespondType: 'JSON',
  }

  console.log('物流 API 參數:', {
    merchantId,
    params,
    apiUrl: `${apiUrl}/printLabel`,
  })

  // 加密資料
  const encryptedData = encryptLogisticsData(params)

  // 產生雜湊值
  const hashData = generateLogisticsHash(encryptedData)

  // 發送 API 請求
  const formData = new URLSearchParams({
    UID_: merchantId,
    Version_: '1.0',
    RespondType_: 'JSON',
    EncryptData_: encryptedData,
    HashData_: hashData,
  })

  console.log('發送物流 API 請求:', {
    url: `${apiUrl}/printLabel`,
    merchantId,
    encryptedDataLength: encryptedData.length,
    hashDataLength: hashData.length,
  })

  const response = await fetch(`${apiUrl}/printLabel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const responseText = await response.text()
  console.log('物流 API 回應:', responseText)

  let result: any
  try {
    result = JSON.parse(responseText)
  } catch (e) {
    throw new Error(`物流 API 回應格式錯誤: ${responseText}`)
  }

  // 檢查回傳狀態
  if (result.Status !== 'SUCCESS') {
    throw new Error(`列印標籤失敗: ${result.Message || '未知錯誤'}`)
  }

  return result
}

/**
 * 建立物流配送單
 * @param orderData 訂單資料
 */
export async function createShipment(orderData: {
  merchantOrderNo: string
  receiverName: string
  receiverPhone: string
  receiverStoreId: string // 超商店號
  receiverStoreName: string // 超商店名
  goodsName: string
  goodsAmount: number
  senderName?: string
  senderPhone?: string
}): Promise<any> {
  const { apiUrl, merchantId } = LOGISTICS_CONFIG

  // 準備參數
  const params = {
    UID_: merchantId,
    LgsType: 'B2C',
    ShipType: '2', // 全家
    MerchantOrderNo: orderData.merchantOrderNo,
    ReceiverName: orderData.receiverName,
    ReceiverCellPhone: orderData.receiverPhone,
    ReceiverStoreID: orderData.receiverStoreId,
    ReceiverStoreName: orderData.receiverStoreName,
    GoodsName: orderData.goodsName,
    GoodsAmount: orderData.goodsAmount.toString(),
    SenderName: orderData.senderName || '鞋店',
    SenderCellPhone: orderData.senderPhone || '',
    Version: '1.0',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    RespondType: 'JSON',
  }

  // 加密資料
  const encryptedData = encryptLogisticsData(params)

  // 產生雜湊值
  const hashData = generateLogisticsHash(encryptedData)

  // 發送 API 請求
  const response = await fetch(`${apiUrl}/createShipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      UID_: merchantId,
      Version_: '1.0',
      RespondType_: 'JSON',
      EncryptData_: encryptedData,
      HashData_: hashData,
    }),
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
  const { apiUrl, merchantId } = LOGISTICS_CONFIG

  // 準備參數
  const params = {
    UID_: merchantId,
    MerchantOrderNo: merchantOrderNo,
    Version: '1.0',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    RespondType: 'JSON',
  }

  // 加密資料
  const encryptedData = encryptLogisticsData(params)

  // 產生雜湊值
  const hashData = generateLogisticsHash(encryptedData)

  // 發送 API 請求
  const response = await fetch(`${apiUrl}/queryShipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      UID_: merchantId,
      Version_: '1.0',
      RespondType_: 'JSON',
      EncryptData_: encryptedData,
      HashData_: hashData,
    }),
  })

  if (!response.ok) {
    throw new Error(`物流 API 請求失敗: ${response.statusText}`)
  }

  const result = await response.json()

  return result
}
