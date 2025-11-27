/**
 * 訂單通知服務
 * 處理訂單相關的郵件和 LINE 通知
 */

import { sendEmail, generateEmailTemplate } from './email'

// 商店資訊
const STORE_NAME = process.env.SMTP_FROM_NAME || '鞋店電商'
const STORE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const STORE_EMAIL = process.env.SMTP_FROM_EMAIL || 'support@shoestore.com'
const STORE_PHONE = process.env.STORE_PHONE || '02-2345-6789'

// LINE Notify Token（可選）
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN

interface OrderItem {
  productName: string
  productImage?: string
  color?: string
  sizeEu: string
  quantity: number
  price: number | any
  subtotal: number | any
}

interface OrderData {
  orderNumber: string
  total: number | any
  subtotal: number | any
  shippingFee: number | any
  discount?: number | any
  creditUsed?: number | any
  shippingName: string
  shippingPhone: string
  shippingCity: string
  shippingDistrict: string
  shippingStreet: string
  shippingZipCode: string
  paymentMethod?: string
  paymentTypeName?: string
  items: OrderItem[]
  payment?: {
    atmBankCode?: string
    atmVirtualAccount?: string
    atmExpireDate?: Date | string
    cvsPaymentNo?: string
    cvsExpireDate?: Date | string
  }
}

/**
 * 格式化金額
 */
function formatCurrency(amount: number | any): string {
  const num = typeof amount === 'number' ? amount : Number(amount)
  return `NT$ ${num.toLocaleString()}`
}

/**
 * 格式化日期時間
 */
function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 生成訂單確認郵件 HTML
 */
function generateOrderConfirmationHtml(order: OrderData, isPaid: boolean): string {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${item.productImage ? `<img src="${item.productImage}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : ''}
          <div>
            <div style="font-weight: 500;">${item.productName}</div>
            <div style="font-size: 12px; color: #666;">${item.color ? `${item.color} / ` : ''}EU ${item.sizeEu}</div>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  // ATM 轉帳資訊
  let paymentInfoHtml = ''
  if (!isPaid && order.payment?.atmVirtualAccount) {
    paymentInfoHtml = `
      <div style="background-color: #fff8e1; border: 1px solid #ffcc02; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #f57c00; margin: 0 0 15px 0;">ATM 轉帳資訊</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0; color: #666;">銀行代碼：</td>
            <td style="padding: 5px 0; font-weight: bold;">${order.payment.atmBankCode}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">虛擬帳號：</td>
            <td style="padding: 5px 0; font-weight: bold; font-family: monospace;">${order.payment.atmVirtualAccount}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">轉帳金額：</td>
            <td style="padding: 5px 0; font-weight: bold; color: #e53935;">${formatCurrency(order.total)}</td>
          </tr>
          ${order.payment.atmExpireDate ? `
          <tr>
            <td style="padding: 5px 0; color: #666;">繳費期限：</td>
            <td style="padding: 5px 0; font-weight: bold; color: #f57c00;">${formatDateTime(order.payment.atmExpireDate)}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `
  }

  // 超商代碼資訊
  if (!isPaid && order.payment?.cvsPaymentNo) {
    paymentInfoHtml = `
      <div style="background-color: #fff8e1; border: 1px solid #ffcc02; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #f57c00; margin: 0 0 15px 0;">超商繳費資訊</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0; color: #666;">繳費代碼：</td>
            <td style="padding: 5px 0; font-weight: bold; font-family: monospace;">${order.payment.cvsPaymentNo}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">繳費金額：</td>
            <td style="padding: 5px 0; font-weight: bold; color: #e53935;">${formatCurrency(order.total)}</td>
          </tr>
          ${order.payment.cvsExpireDate ? `
          <tr>
            <td style="padding: 5px 0; color: #666;">繳費期限：</td>
            <td style="padding: 5px 0; font-weight: bold; color: #f57c00;">${formatDateTime(order.payment.cvsExpireDate)}</td>
          </tr>
          ` : ''}
        </table>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">請攜帶此繳費代碼至超商繳費機繳費。</p>
      </div>
    `
  }

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: ${isPaid ? '#4caf50' : '#ff9800'}; color: white; display: inline-block; padding: 10px 30px; border-radius: 50px; font-size: 18px; font-weight: bold;">
        ${isPaid ? '付款成功' : '訂單成立'}
      </div>
    </div>

    <p style="font-size: 16px;">親愛的 ${order.shippingName} 您好，</p>
    <p style="font-size: 16px;">
      ${isPaid
        ? '感謝您的購買！我們已收到您的付款，正在為您準備商品。'
        : '感謝您的訂購！您的訂單已成功建立。'}
    </p>

    <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333;">訂單資訊</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0; color: #666;">訂單編號：</td>
          <td style="padding: 5px 0; font-weight: bold; font-family: monospace;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">訂單時間：</td>
          <td style="padding: 5px 0;">${formatDateTime(new Date())}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">付款方式：</td>
          <td style="padding: 5px 0;">${order.paymentTypeName || order.paymentMethod || '線上付款'}</td>
        </tr>
      </table>
    </div>

    ${paymentInfoHtml}

    <h3 style="margin: 30px 0 15px 0; color: #333;">訂購商品</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 12px; text-align: left;">商品</th>
          <th style="padding: 12px; text-align: center; width: 60px;">數量</th>
          <th style="padding: 12px; text-align: right; width: 100px;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0; color: #666;">商品小計：</td>
          <td style="padding: 5px 0; text-align: right;">${formatCurrency(order.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">運費：</td>
          <td style="padding: 5px 0; text-align: right;">${formatCurrency(order.shippingFee)}</td>
        </tr>
        ${order.discount && Number(order.discount) > 0 ? `
        <tr>
          <td style="padding: 5px 0; color: #4caf50;">折扣：</td>
          <td style="padding: 5px 0; text-align: right; color: #4caf50;">-${formatCurrency(order.discount)}</td>
        </tr>
        ` : ''}
        ${order.creditUsed && Number(order.creditUsed) > 0 ? `
        <tr>
          <td style="padding: 5px 0; color: #4caf50;">購物金折抵：</td>
          <td style="padding: 5px 0; text-align: right; color: #4caf50;">-${formatCurrency(order.creditUsed)}</td>
        </tr>
        ` : ''}
        <tr style="border-top: 2px solid #ddd;">
          <td style="padding: 15px 0 5px 0; font-size: 18px; font-weight: bold;">總計：</td>
          <td style="padding: 15px 0 5px 0; text-align: right; font-size: 18px; font-weight: bold; color: #e53935;">${formatCurrency(order.total)}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1976d2;">收件資訊</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0; color: #666;">收件人：</td>
          <td style="padding: 5px 0;">${order.shippingName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">電話：</td>
          <td style="padding: 5px 0;">${order.shippingPhone}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">地址：</td>
          <td style="padding: 5px 0;">${order.shippingZipCode} ${order.shippingCity}${order.shippingDistrict}${order.shippingStreet}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${STORE_URL}/account/orders" style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        查看訂單狀態
      </a>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px;">
      <p>如有任何問題，請聯繫我們：</p>
      <p>電話：${STORE_PHONE} | Email：${STORE_EMAIL}</p>
    </div>
  `

  return generateEmailTemplate({
    title: isPaid ? `付款成功 - 訂單 ${order.orderNumber}` : `訂單確認 - ${order.orderNumber}`,
    content,
  })
}

/**
 * 發送訂單確認郵件
 */
export async function sendOrderConfirmationEmail(
  email: string,
  order: OrderData,
  isPaid: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = generateOrderConfirmationHtml(order, isPaid)
    const subject = isPaid
      ? `[${STORE_NAME}] 付款成功 - 訂單 ${order.orderNumber}`
      : `[${STORE_NAME}] 訂單確認 - ${order.orderNumber}`

    const result = await sendEmail({
      to: email,
      subject,
      html,
    })

    if (result.success) {
      console.log(`訂單確認郵件已發送: ${email} (訂單: ${order.orderNumber})`)
    } else {
      console.error(`訂單確認郵件發送失敗: ${email}`, result.error)
    }

    return result
  } catch (error: any) {
    console.error(`發送訂單確認郵件時發生錯誤:`, error)
    return {
      success: false,
      error: error.message || '未知錯誤',
    }
  }
}

/**
 * 發送 LINE Notify 通知（給商家）
 */
export async function sendLineNotify(message: string): Promise<{ success: boolean; error?: string }> {
  if (!LINE_NOTIFY_TOKEN) {
    console.log('LINE Notify 未配置，跳過通知')
    return { success: true }
  }

  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`,
      },
      body: new URLSearchParams({ message }),
    })

    if (!response.ok) {
      throw new Error(`LINE Notify API 錯誤: ${response.status}`)
    }

    console.log('LINE Notify 通知已發送')
    return { success: true }
  } catch (error: any) {
    console.error('LINE Notify 發送失敗:', error)
    return {
      success: false,
      error: error.message || '未知錯誤',
    }
  }
}

/**
 * 發送新訂單通知給商家（LINE）
 */
export async function notifyNewOrder(order: OrderData): Promise<void> {
  const message = `
新訂單通知！

訂單編號: ${order.orderNumber}
收件人: ${order.shippingName}
金額: ${formatCurrency(order.total)}
商品數量: ${order.items.length} 項

查看詳情: ${STORE_URL}/admin/orders
  `.trim()

  await sendLineNotify(message)
}

/**
 * 發送付款成功通知給商家（LINE）
 */
export async function notifyPaymentSuccess(order: OrderData): Promise<void> {
  const message = `
付款成功通知！

訂單編號: ${order.orderNumber}
收件人: ${order.shippingName}
金額: ${formatCurrency(order.total)}

請盡快出貨！
  `.trim()

  await sendLineNotify(message)
}
