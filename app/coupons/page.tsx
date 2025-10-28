'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GET_PUBLIC_COUPONS, CLAIM_COUPON } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  userLimit?: number
  isActive: boolean
  validFrom: string
  validUntil: string
}

export default function CouponsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const { data, loading, refetch } = useQuery(GET_PUBLIC_COUPONS)

  const [claimCoupon, { loading: claiming }] = useMutation(CLAIM_COUPON, {
    onCompleted: () => {
      alert('領取成功！')
      refetch()
    },
    onError: (error) => {
      alert(error.message || '領取失敗')
    },
  })

  const handleClaim = async (code: string) => {
    if (!isAuthenticated) {
      alert('請先登入')
      router.push('/auth/login')
      return
    }

    await claimCoupon({ variables: { code } })
  }

  const getCouponTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return '折扣'
      case 'FIXED':
        return '滿減'
      case 'FREE_SHIPPING':
        return '免運'
      case 'BUY_X_GET_Y':
        return '買送'
      default:
        return type
    }
  }

  const formatCouponValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'PERCENTAGE':
        return `${coupon.value}% OFF`
      case 'FIXED':
        return `NT$ ${Number(coupon.value).toLocaleString()}`
      case 'FREE_SHIPPING':
        return '免運費'
      default:
        return coupon.value
    }
  }

  const isExpiringSoon = (validUntil: string) => {
    const until = new Date(validUntil)
    const now = new Date()
    const daysLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3
  }

  const getRemainingUsage = (coupon: Coupon) => {
    if (!coupon.usageLimit) return null
    return coupon.usageLimit - coupon.usedCount
  }

  if (loading) {
    return <div className="text-center py-16">載入中...</div>
  }

  const coupons: Coupon[] = data?.publicCoupons || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">優惠券中心</h1>
          <p className="text-gray-600 mt-2">領取優惠券，享受更多優惠</p>
        </div>
        {isAuthenticated && (
          <Link
            href="/profile/coupons"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            我的優惠券
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600">目前沒有可領取的優惠券</p>
          </div>
        ) : (
          coupons.map((coupon) => {
            const remaining = getRemainingUsage(coupon)
            const expiringSoon = isExpiringSoon(coupon.validUntil)

            return (
              <div
                key={coupon.id}
                className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border-2 border-primary-200 relative overflow-hidden"
              >
                {/* 裝飾性背景 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                {/* 優惠券類型標籤 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                    {getCouponTypeLabel(coupon.type)}
                  </span>
                  {expiringSoon && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                      即將到期
                    </span>
                  )}
                </div>

                {/* 優惠金額 */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {formatCouponValue(coupon)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{coupon.name}</h3>
                  {coupon.description && (
                    <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                  )}
                </div>

                {/* 使用條件 */}
                <div className="space-y-1 text-sm text-gray-700 mb-4">
                  {coupon.minAmount && (
                    <p>滿 NT$ {Number(coupon.minAmount).toLocaleString()} 可用</p>
                  )}
                  {coupon.maxDiscount && coupon.type === 'PERCENTAGE' && (
                    <p>最高折抵 NT$ {Number(coupon.maxDiscount).toLocaleString()}</p>
                  )}
                  <p>
                    有效期至 {new Date(coupon.validUntil).toLocaleDateString('zh-TW')}
                  </p>
                  {remaining !== null && (
                    <p className="text-orange-600">
                      剩餘 {remaining} 張
                    </p>
                  )}
                </div>

                {/* 優惠碼 */}
                <div className="mb-4 p-3 bg-white rounded-lg border-2 border-dashed border-primary-300">
                  <p className="text-xs text-gray-600 mb-1">優惠碼</p>
                  <p className="text-lg font-mono font-bold text-primary-600">
                    {coupon.code}
                  </p>
                </div>

                {/* 領取按鈕 */}
                <button
                  onClick={() => handleClaim(coupon.code)}
                  disabled={claiming || remaining === 0}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {claiming ? '領取中...' : remaining === 0 ? '已搶光' : '立即領取'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
