/**
 * 產品詳情頁 - 鞋店核心頁面
 *
 * 效能優化：
 * - 使用伺服器端直接 Prisma 查詢，避免 SSR 時的 HTTP 往返
 * - React cache 確保 generateMetadata 和頁面組件共用同一次查詢結果
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ModernProductDetail from './ModernProductDetail'
import { getProductBySlug, getProductSlugsForStaticGeneration } from '@/lib/server-queries'

// ISR: 每 10 分鐘重新驗證一次
export const revalidate = 600

// 預先生成熱門產品頁面（構建時靜態生成）
export async function generateStaticParams() {
  const slugs = await getProductSlugsForStaticGeneration(100)
  return slugs.map((slug) => ({ slug }))
}

// getProductBySlug 已經使用 React cache，會自動去重

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: '產品未找到 - SHOE STORE',
      description: '該產品不存在或已下架',
    }
  }

  return {
    title: `${product.name} - SHOE STORE`,
    description: product.description || `購買 ${product.name}，優質鞋款`,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <>
      <ModernProductDetail product={product} />
    </>
  )
}
