'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_MY_REVIEWS } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  images: string[]
  sizeFit?: string
  boughtSize?: string
  verified: boolean
  isApproved: boolean
  createdAt: string
  product: {
    id: string
    name: string
    images: string[]
  }
}

export default function MyReviewsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, refetch } = useQuery(GET_MY_REVIEWS, {
    skip: !isAuthenticated,
  })

  if (authLoading || loading) {
    return <div className="text-center py-16">載入中...</div>
  }

  const reviews: Review[] = data?.myReviews || []

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    )
  }

  const getSizeFitLabel = (sizeFit?: string) => {
    switch (sizeFit) {
      case 'TOO_SMALL':
        return '偏小'
      case 'PERFECT':
        return '剛好'
      case 'TOO_LARGE':
        return '偏大'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的評論</h1>
        <Link
          href="/orders"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          去評論商品
        </Link>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">您還沒有撰寫任何評論</p>
            <Link
              href="/orders"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              查看我的訂單
            </Link>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex gap-4">
                {/* 產品圖片 */}
                <Link href={`/products/${review.product.id}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    {review.product.images[0] && (
                      <Image
                        src={review.product.images[0]}
                        alt={review.product.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                </Link>

                {/* 評論內容 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/products/${review.product.id}`}
                        className="font-medium hover:text-primary-600"
                      >
                        {review.product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            已驗證購買
                          </span>
                        )}
                        {!review.isApproved && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                            審核中
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('zh-TW')}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="font-medium text-gray-900 mb-2">{review.title}</h3>
                  )}

                  <p className="text-gray-700 mb-3">{review.content}</p>

                  {/* 尺寸資訊 */}
                  {(review.boughtSize || review.sizeFit) && (
                    <div className="flex gap-4 text-sm text-gray-600 mb-3">
                      {review.boughtSize && (
                        <span>購買尺寸: EU {review.boughtSize}</span>
                      )}
                      {review.sizeFit && (
                        <span>尺寸感受: {getSizeFitLabel(review.sizeFit)}</span>
                      )}
                    </div>
                  )}

                  {/* 評論圖片 */}
                  {review.images.length > 0 && (
                    <div className="flex gap-2">
                      {review.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden"
                        >
                          <Image
                            src={img}
                            alt={`評論圖片 ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/profile" className="inline-block mt-6 text-primary-600 hover:text-primary-700">
        ← 返回個人中心
      </Link>
    </div>
  )
}
