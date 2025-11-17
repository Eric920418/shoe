/**
 * 藍新金流（NewebPay）整合工具
 *
 * 功能：
 * - AES 加密/解密
 * - SHA256 驗證
 * - 產生支付表單資料
 * - 驗證支付回傳資料
 */

import crypto from 'crypto';

// ============================================
// 環境變數配置
// ============================================

const NEWEBPAY_CONFIG = {
  merchantId: process.env.NEWEBPAY_MERCHANT_ID!,
  hashKey: process.env.NEWEBPAY_HASH_KEY!,
  hashIV: process.env.NEWEBPAY_HASH_IV!,
  mpgUrl: process.env.NEWEBPAY_MPG_URL!,
  queryUrl: process.env.NEWEBPAY_QUERY_URL!,
  notifyUrl: process.env.NEWEBPAY_NOTIFY_URL!,
  returnUrl: process.env.NEWEBPAY_RETURN_URL!,
  clientBackUrl: process.env.NEWEBPAY_CLIENT_BACK_URL!,
};

// 驗證必要的環境變數
if (!NEWEBPAY_CONFIG.merchantId || !NEWEBPAY_CONFIG.hashKey || !NEWEBPAY_CONFIG.hashIV) {
  throw new Error('藍新金流環境變數未設定：請檢查 NEWEBPAY_MERCHANT_ID, NEWEBPAY_HASH_KEY, NEWEBPAY_HASH_IV');
}

// ============================================
// 類型定義
// ============================================

export type NewebPaymentType = 'CREDIT_CARD' | 'VACC' | 'CVS' | 'BARCODE' | 'WEBATM';

export interface CreatePaymentParams {
  merchantOrderNo: string;    // 商店訂單編號（唯一）
  amount: number;             // 訂單金額
  itemDesc: string;           // 商品描述
  email: string;              // 付款人Email
  paymentTypes: NewebPaymentType[];  // 啟用的支付方式
  // 選填欄位
  loginType?: 0 | 1;          // 0: 不須登入藍新金流會員, 1: 須登入
  orderComment?: string;      // 商店備註
  tradeLimit?: number;        // 交易限制秒數（60-900秒，預設180）
  expireDate?: string;        // 繳費有效期限（格式：YYYY-MM-DD）
}

export interface PaymentFormData {
  MerchantID: string;
  TradeInfo: string;          // AES 加密資料
  TradeSha: string;           // SHA256 驗證碼
  Version: string;
}

export interface DecryptedTradeInfo {
  Status: string;             // 回傳狀態
  Message: string;            // 回傳訊息
  Result: {
    MerchantID: string;
    Amt: number;
    TradeNo: string;          // 藍新金流交易序號
    MerchantOrderNo: string;  // 商店訂單編號
    PaymentType: string;      // 支付方式
    PayTime?: string;         // 支付完成時間
    // ATM 專用
    BankCode?: string;
    CodeNo?: string;
    PayBankCode?: string;
    ExpireDate?: string;
    // 超商專用
    CodeNo?: string;
    StoreCode?: string;
    ExpireDate?: string;
    // 信用卡專用
    Auth?: string;
    Card4No?: string;
    Card6No?: string;
    AuthBank?: string;
    RespondCode?: string;
    ECI?: string;
    TokenUseStatus?: number;
    [key: string]: any;
  };
}

// ============================================
// 加密/解密函數
// ============================================

/**
 * AES-256-CBC 加密
 * @param data 要加密的資料（字串）
 * @returns 加密後的 hex 字串
 */
export function aesEncrypt(data: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(NEWEBPAY_CONFIG.hashKey, 'utf8'),
    Buffer.from(NEWEBPAY_CONFIG.hashIV, 'utf8')
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted.toUpperCase(); // 藍新金流要求大寫
}

/**
 * AES-256-CBC 解密
 * @param encryptedData 加密的 hex 字串
 * @returns 解密後的字串
 */
export function aesDecrypt(encryptedData: string): string {
  try {
    // 移除可能的空白字符和換行
    const cleanedData = encryptedData.trim();

    // ⚠️ PCI 合規：不記錄完整的加密資料（可能包含卡號資訊）
    console.log('解密前檢查:');
    console.log('- 加密資料長度:', cleanedData.length);
    console.log('- HashKey 長度:', NEWEBPAY_CONFIG.hashKey.length);
    console.log('- HashIV 長度:', NEWEBPAY_CONFIG.hashIV.length);

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(NEWEBPAY_CONFIG.hashKey, 'utf8'),
      Buffer.from(NEWEBPAY_CONFIG.hashIV, 'utf8')
    );

    // 設置自動填充
    decipher.setAutoPadding(true);

    // 將輸入轉為小寫以相容大小寫
    let decrypted = decipher.update(cleanedData.toLowerCase(), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    console.log('✅ 解密成功');
    return decrypted;
  } catch (error) {
    console.error('❌ AES 解密失敗:', error instanceof Error ? error.message : '未知錯誤');
    throw new Error(`AES 解密失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 產生 SHA256 雜湊
 * @param data 要雜湊的資料
 * @returns SHA256 雜湊值（大寫）
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
}

/**
 * 產生 TradeSha（用於驗證）
 * @param tradeInfo 已加密的 TradeInfo
 * @returns TradeSha 驗證碼
 */
export function generateTradeSha(tradeInfo: string): string {
  const str = `HashKey=${NEWEBPAY_CONFIG.hashKey}&${tradeInfo}&HashIV=${NEWEBPAY_CONFIG.hashIV}`;
  return sha256(str);
}

/**
 * 驗證回傳的 TradeSha 是否正確
 * @param tradeInfo 加密的 TradeInfo
 * @param tradeSha 回傳的 TradeSha
 * @returns 是否驗證成功
 */
export function verifyTradeSha(tradeInfo: string, tradeSha: string): boolean {
  const calculatedSha = generateTradeSha(tradeInfo);
  return calculatedSha === tradeSha.toUpperCase();
}

// ============================================
// 支付資料處理
// ============================================

/**
 * 將物件轉換為 URL query string 格式（符合藍新金流 http_build_query 規範）
 * @param obj 要轉換的物件
 * @returns URL query string (key=value&key=value)，值已進行 URL encode
 */
function objectToQueryString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // URL encode 每個值，避免 &、= 等特殊字符造成解析問題
      const encodedValue = encodeURIComponent(String(value));
      return `${key}=${encodedValue}`;
    })
    .join('&');
}

/**
 * 將 URL query string 轉換為物件
 * @param queryString URL query string
 * @returns 解析後的物件
 */
function queryStringToObject(queryString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      result[key] = decodeURIComponent(value);
    }
  }

  return result;
}

/**
 * 產生支付表單資料
 * @param params 支付參數
 * @returns 加密後的表單資料
 */
export function createPaymentFormData(params: CreatePaymentParams): PaymentFormData {
  // ⚠️ 驗證 Amt：MPG01016 規定必須是整數（Int(10)），範圍 1-99999999
  // 重要：不使用 Math.floor 截斷小數，而是直接拒絕非整數金額
  const amount = Number(params.amount);

  // 檢查是否為有效的整數
  if (!Number.isInteger(amount)) {
    throw new Error(
      `訂單金額必須是整數：收到 ${params.amount}（${amount}），` +
      `請檢查訂單金額設定。藍新金流 MPG01016 規定金額必須是整數。`
    );
  }

  // 檢查金額範圍
  if (amount < 1 || amount > 99999999) {
    throw new Error(`訂單金額超出範圍：${amount}，必須在 1-99999999 之間`);
  }

  // ⚠️ 驗證 ItemDesc：MPG01018 規定最多 50 字
  let itemDesc = String(params.itemDesc);
  if (itemDesc.length > 50) {
    console.warn(`ItemDesc 超過 50 字，將自動截斷：${itemDesc}`);
    itemDesc = itemDesc.substring(0, 47) + '...'; // 保留 47 字 + "..."
  }

  // 建立 TradeInfo 內容
  const tradeData: Record<string, any> = {
    MerchantID: NEWEBPAY_CONFIG.merchantId,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: '2.0',
    MerchantOrderNo: params.merchantOrderNo,
    Amt: amount, // 使用驗證過的整數金額
    ItemDesc: itemDesc, // 使用長度限制後的描述
    Email: params.email,
    NotifyURL: NEWEBPAY_CONFIG.notifyUrl,
    ReturnURL: NEWEBPAY_CONFIG.returnUrl,
    ClientBackURL: NEWEBPAY_CONFIG.clientBackUrl,
    LoginType: params.loginType ?? 0,
  };

  // 設定支付方式（藍新金流要求各支付方式單獨設定）
  if (params.paymentTypes.includes('CREDIT_CARD')) {
    tradeData.CREDIT = 1;
  }
  if (params.paymentTypes.includes('VACC')) {
    tradeData.VACC = 1;
  }
  if (params.paymentTypes.includes('CVS')) {
    tradeData.CVS = 1;
  }
  if (params.paymentTypes.includes('BARCODE')) {
    tradeData.BARCODE = 1;
  }
  if (params.paymentTypes.includes('WEBATM')) {
    tradeData.WEBATM = 1;
  }

  // 選填欄位
  if (params.orderComment) {
    tradeData.OrderComment = params.orderComment;
  }
  if (params.tradeLimit) {
    tradeData.TradeLimit = params.tradeLimit;
  }
  if (params.expireDate) {
    tradeData.ExpireDate = params.expireDate;
  }

  // 轉換為 query string 並加密
  const queryString = objectToQueryString(tradeData);
  const tradeInfo = aesEncrypt(queryString);
  const tradeSha = generateTradeSha(tradeInfo);

  return {
    MerchantID: NEWEBPAY_CONFIG.merchantId,
    TradeInfo: tradeInfo,
    TradeSha: tradeSha,
    Version: '2.0',
  };
}

/**
 * 解密並驗證藍新金流回傳資料
 * ⚠️ 安全性：根據藍新金流 MPG 手冊，TradeSha 是完整性驗證機制，必須強制執行
 * @param tradeInfo 加密的 TradeInfo
 * @param tradeSha 回傳的 TradeSha
 * @returns 解密後的交易資料
 * @throws 如果驗證失敗
 */
export function decryptTradeInfo(tradeInfo: string, tradeSha: string): DecryptedTradeInfo {
  console.log('=== 開始驗證藍新金流資料 ===');
  console.log('TradeInfo 長度:', tradeInfo.length);

  // ⚠️ 第一步：先驗證 TradeSha，防止資料遭竄改（MPG 手冊要求）
  const calculatedSha = generateTradeSha(tradeInfo);
  const isValid = calculatedSha === tradeSha.toUpperCase();

  if (!isValid) {
    console.error('❌ TradeSha 驗證失敗 - 資料可能遭竄改');
    console.error('預期 SHA (前20字):', calculatedSha.substring(0, 20) + '...');
    console.error('實際 SHA (前20字):', tradeSha.toUpperCase().substring(0, 20) + '...');
    throw new Error('藍新金流回傳資料驗證失敗：TradeSha 不符，資料可能遭竄改');
  }

  console.log('✅ TradeSha 驗證通過');

  // 第二步：驗證通過後才解密
  let decrypted: string;
  try {
    decrypted = aesDecrypt(tradeInfo);
  } catch (error) {
    throw new Error(`TradeInfo 解密失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }

  // 第三步：解析 JSON（藍新金流回傳的是 JSON 字串）
  try {
    const data = JSON.parse(decrypted);
    console.log('✅ JSON 解析成功');
    console.log('Status:', data.Status);
    console.log('Message:', data.Message);
    return data as DecryptedTradeInfo;
  } catch (error) {
    console.error('❌ JSON 解析失敗');
    throw new Error(`JSON 解析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 格式化支付方式名稱（前端顯示用）
 * @param paymentType 支付方式代碼
 * @returns 中文名稱
 */
export function formatPaymentType(paymentType: string): string {
  const mapping: Record<string, string> = {
    'CREDIT': '信用卡',
    'CREDIT_CARD': '信用卡',
    'VACC': 'ATM 轉帳',
    'CVS': '超商代碼',
    'BARCODE': '超商條碼',
    'WEBATM': '網路 ATM',
  };
  return mapping[paymentType] || paymentType;
}

/**
 * 產生商店訂單編號（建議格式：時間戳 + 隨機碼）
 * @param prefix 前綴（選填）
 * @returns 唯一訂單編號
 */
export function generateMerchantOrderNo(prefix: string = 'ORD'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// ============================================
// 導出配置（供其他模組使用）
// ============================================

export { NEWEBPAY_CONFIG };
