'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { GET_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import ReviewForm from '@/components/ReviewForm'

export default function ReviewProductPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string
  const productId = params?.productId as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('請先登入')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    skip: !isAuthenticated || !orderId,
  })

  if (authLoading || loading) {
    return <div className="text-center py-16">載入中...</div>
  }

  const order = data?.order
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">找不到訂單</p>
        <Link href="/orders" className="text-primary-600 hover:text-primary-700">
          返回訂單列表
        </Link>
      </div>
    )
  }

  const orderItem = order.items.find((item: any) => item.product?.id === productId)
  if (!orderItem || !orderItem.product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">找不到商品</p>
        <Link href={`/orders/${orderId}`} className="text-primary-600 hover:text-primary-700">
          返回訂單詳情
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href={`/orders/${orderId}`}
        className="text-primary-600 hover:text-primary-700 mb-6 inline-block"
      >
        ← 返回訂單詳情
      </Link>

      <ReviewForm
        productId={productId}
        productName={orderItem.product.name}
        orderId={orderId}
        onSuccess={() => {
          router.push('/profile/reviews')
        }}
        onCancel={() => {
          router.push(`/orders/${orderId}`)
        }}
      />
    </div>
  )
}
