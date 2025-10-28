/**
 * 產品詳情頁 - 鞋店核心頁面
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import { apolloClient } from '@/lib/apollo-client'
import { GET_PRODUCT_BY_SLUG } from '@/graphql/queries'

async function getProduct(slug: string) {
  try {
    const { data, errors } = await apolloClient.query({
      query: GET_PRODUCT_BY_SLUG,
      variables: { slug },
      fetchPolicy: 'network-only',
    })

    if (errors || !data?.product) {
      console.error('GraphQL errors:', errors)
      return null
    }

    return data.product
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: '產品未找到 - 鞋店電商',
      description: '該產品不存在或已下架',
    }
  }

  return {
    title: `${product.name} - 鞋店電商`,
    description: product.description,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
