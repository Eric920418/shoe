/**
 * 輸入驗證工具函數（使用加強版安全檢查）
 */

import {
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  sanitizeHtml as sanitizeHtmlSafe,
} from './security'

/**
 * 驗證電子郵件格式
 */
export function validateEmail(email: string): boolean {
  return isValidEmail(email)
}

/**
 * 驗證密碼強度
 * 要求：至少8個字符，包含大小写字母和數字
 */
export function validatePassword(password: string): boolean {
  return isStrongPassword(password)
}

/**
 * 驗證手機號碼（台灣格式）
 */
export function validatePhone(phone: string): boolean {
  return isValidPhone(phone)
}

/**
 * 清理HTML標籤（防XSS）
 */
export function sanitizeHtml(input: string): string {
  return sanitizeHtmlSafe(input)
}

/**
 * 驗證使用者名稱（僅允許字母、數字、底線，3-20個字符）
 */
export function validateUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 20) return false
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  return usernameRegex.test(username)
}

/**
 * 驗證郵政編碼（台灣格式）
 */
export function validateZipCode(zipCode: string): boolean {
  if (!zipCode) return false
  const zipRegex = /^\d{3,5}$/
  return zipRegex.test(zipCode)
}

/**
 * 驗證價格（必須為正數，最多兩位小數）
 */
export function validatePrice(price: number | string): boolean {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(priceNum) || priceNum < 0) return false

  // 檢查小數位數不超過2位
  const decimalPart = priceNum.toString().split('.')[1]
  if (decimalPart && decimalPart.length > 2) return false

  return true
}

/**
 * 驗證庫存數量（必須为非負整數）
 */
export function validateStock(stock: number | string): boolean {
  const stockNum = typeof stock === 'string' ? parseInt(stock) : stock
  return Number.isInteger(stockNum) && stockNum >= 0
}

/**
 * 驗證SKU（僅允許字母、數字、短橫線，3-50個字符）
 */
export function validateSKU(sku: string): boolean {
  if (!sku || sku.length < 3 || sku.length > 50) return false
  const skuRegex = /^[a-zA-Z0-9-]+$/
  return skuRegex.test(sku)
}
