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

/** 每個物流廠商限制一次可列印的標籤數量（參考《物流服務技術串接手冊》） */
const PRINT_LABEL_LIMITS: Record<string, number> = {
  '1': 10, // 統一
  '2': 8,  // 全家（官方文件指出 C2C 限制 8 筆 / A4 兩張）
  '3': 10, // 萊爾富
  '4': 10, // OK
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

  const maxPerRequest = PRINT_LABEL_LIMITS[shipType] || 10
  const batches: string[][] = []
  for (let i = 0; i < orderNumbers.length; i += maxPerRequest) {
    batches.push(orderNumbers.slice(i, i + maxPerRequest))
  }

  const responses: any[] = []
  for (const batch of batches) {
    const encryptParams: Record<string, any> = {
      LgsType: lgsType,
      ShipType: shipType,
      MerchantOrderNo: batch,
      TimeStamp: Math.floor(Date.now() / 1000).toString(),
    }

    console.log('物流 API 參數:', {
      merchantId,
      batchSize: batch.length,
      apiUrl: `${apiUrl}/printLabel`,
    })

    const encryptedData = encryptLogisticsData(encryptParams)
    const hashData = generateLogisticsHash(encryptedData)

    const formData = new URLSearchParams({
      UID_: merchantId,
      Version_: '1.0',
      RespondType_: 'JSON',
      EncryptData_: encryptedData,
      HashData_: hashData,
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

    if (result.Status !== 'SUCCESS') {
      throw new Error(`列印標籤失敗: ${result.Message || '未知錯誤'}`)
    }

    responses.push(result)
  }

  if (responses.length === 1) {
    return responses[0]
  }

  return {
    Status: 'SUCCESS',
    Message: '已分批送出物流列印請求',
    Results: responses,
  }
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
  const { apiUrl, merchantId, hashKey, hashIV } = LOGISTICS_CONFIG

  // 檢查必要參數
  if (!merchantId || !hashKey || !hashIV) {
    throw new Error('物流 API 配置不完整，請檢查環境變數')
  }

  // 準備內層參數（只包含業務欄位）
  const encryptParams = {
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
