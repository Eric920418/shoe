/**
 * Slug 生成工具
 * 將文字轉換為 URL 友善的 slug 格式
 */

import { prisma } from './prisma'
import pinyin from 'pinyin'

/**
 * 將文字轉換為 slug 格式
 * ✅ 自動將中文轉換為拼音，避免 URL 編碼問題
 * @param text 原始文字
 * @returns slug 字串
 */
export function slugify(text: string): string {
  // 檢測是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text)

  let processed = text

  if (hasChinese) {
    // ✅ 將中文轉換為拼音（不帶聲調，用橫線分隔）
    const pinyinArray = pinyin(text, {
      style: pinyin.STYLE_NORMAL, // 不帶聲調
      heteronym: false, // 不使用多音字
    })
    // 將二維陣列扁平化並用橫線連接
    processed = pinyinArray.map(chars => chars.join('')).join('-')
  }

  return processed
    .toString()
    .toLowerCase()
    .trim()
    // 替換空格和底線為橫線
    .replace(/[\s_]+/g, '-')
    // 移除特殊字符（只保留英文、數字、橫線）
    .replace(/[^\w\-]+/g, '')
    // 合併多個橫線
    .replace(/\-\-+/g, '-')
    // 移除開頭和結尾的橫線
    .replace(/^-+|-+$/g, '')
}

/**
 * 為品牌生成唯一的 slug
 * @param name 品牌名稱
 * @param excludeId 排除的品牌 ID（更新時使用）
 * @returns 唯一的 slug
 */
export async function generateUniqueBrandSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  let slug = slugify(name)
  let counter = 1
  let isUnique = false

  while (!isUnique) {
    const existing = await prisma.brand.findUnique({
      where: { slug },
      select: { id: true },
    })

    // 如果沒有找到，或找到的是自己（更新情況），就是唯一的
    if (!existing || (excludeId && existing.id === excludeId)) {
      isUnique = true
    } else {
      // 如果重複，加上數字後綴
      slug = `${slugify(name)}-${counter}`
      counter++
    }
  }

  return slug
}

/**
 * 為分類生成唯一的 slug
 * @param name 分類名稱
 * @param excludeId 排除的分類 ID（更新時使用）
 * @returns 唯一的 slug
 */
export async function generateUniqueCategorySlug(
  name: string,
  excludeId?: string
): Promise<string> {
  let slug = slugify(name)
  let counter = 1
  let isUnique = false

  while (!isUnique) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    })

    // 如果沒有找到，或找到的是自己（更新情況），就是唯一的
    if (!existing || (excludeId && existing.id === excludeId)) {
      isUnique = true
    } else {
      // 如果重複，加上數字後綴
      slug = `${slugify(name)}-${counter}`
      counter++
    }
  }

  return slug
}

/**
 * 為產品生成唯一的 slug
 * @param name 產品名稱
 * @param excludeId 排除的產品 ID（更新時使用）
 * @returns 唯一的 slug
 */
export async function generateUniqueProductSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  let slug = slugify(name)
  let counter = 1
  let isUnique = false

  while (!isUnique) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })

    // 如果沒有找到，或找到的是自己（更新情況），就是唯一的
    if (!existing || (excludeId && existing.id === excludeId)) {
      isUnique = true
    } else {
      // 如果重複，加上數字後綴
      slug = `${slugify(name)}-${counter}`
      counter++
    }
  }

  return slug
}

/**
 * 中文常見詞語的英文對照表
 * 用於生成更友善的 URL（可選）
 */
export const chineseSlugMap: Record<string, string> = {
  // 鞋類分類
  運動鞋: 'sports-shoes',
  皮鞋: 'leather-shoes',
  涼鞋: 'sandals',
  靴子: 'boots',
  休閒鞋: 'casual-shoes',
  高跟鞋: 'high-heels',
  平底鞋: 'flats',
  拖鞋: 'slippers',

  // 品牌相關
  耐克: 'nike',
  愛迪達: 'adidas',
  新百倫: 'new-balance',

  // 通用詞語
  男款: 'mens',
  女款: 'womens',
  兒童: 'kids',
  全新: 'new',
  熱賣: 'hot',
}

/**
 * 使用中文對照表生成 slug（進階功能）
 * @param text 原始文字
 * @returns slug 字串
 */
export function slugifyWithMapping(text: string): string {
  // 先檢查是否有直接對應
  if (chineseSlugMap[text]) {
    return chineseSlugMap[text]
  }

  // 否則使用標準 slugify
  return slugify(text)
}
