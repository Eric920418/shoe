/**
 * 產品詳情頁 - 鞋店核心頁面
 *
 * 效能優化：
 * - 使用伺服器端直接 Prisma 查詢，避免 SSR 時的 HTTP 往返
 * - React cache 確保 generateMetadata 和頁面組件共用同一次查詢結果
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import { getProductBySlug } from '@/lib/server-queries'

// getProductBySlug 已經使用 React cache，會自動去重

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    return {
      title: '產品未找到 - 鞋店電商',
      description: '該產品不存在或已下架',
    }
  }

  return {
    title: `${product.name} - 鞋店電商`,
    description: product.description || `購買 ${product.name}，來自 ${product.brand?.name || '知名品牌'}`,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
