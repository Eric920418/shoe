'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GET_MY_COUPONS } from '@/graphql/queries'
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
  validFrom: string
  validUntil: string
}

interface UserCoupon {
  id: string
  isUsed: boolean
  usedAt?: string
  expiresAt?: string
  obtainedFrom?: string
  createdAt: string
  coupon: Coupon
}

export default function MyCouponsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [filter, setFilter] = useState<'all' | 'available' | 'used'>('available')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, refetch } = useQuery(GET_MY_COUPONS, {
    skip: !isAuthenticated,
  })

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

  const isExpired = (userCoupon: UserCoupon) => {
    const now = new Date()
    const couponExpired = new Date(userCoupon.coupon.validUntil) < now
    const userCouponExpired = userCoupon.expiresAt && new Date(userCoupon.expiresAt) < now
    return couponExpired || userCouponExpired
  }

  const isAvailable = (userCoupon: UserCoupon) => {
    return !userCoupon.isUsed && !isExpired(userCoupon)
  }

  if (authLoading || loading) {
    return <div className="text-center py-16">載入中...</div>
  }

  const allCoupons: UserCoupon[] = data?.myCoupons || []
  const filteredCoupons = allCoupons.filter((uc) => {
    if (filter === 'available') return isAvailable(uc)
    if (filter === 'used') return uc.isUsed
    return true
  })

  const availableCount = allCoupons.filter(isAvailable).length
  const usedCount = allCoupons.filter((uc) => uc.isUsed).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">我的優惠券</h1>
          <p className="text-gray-600 mt-2">
            可用 {availableCount} 張 · 已使用 {usedCount} 張
          </p>
        </div>
        <Link
          href="/coupons"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          領取更多優惠券
        </Link>
      </div>

      {/* 篩選按鈕 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'available'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          可使用 ({availableCount})
        </button>
        <button
          onClick={() => setFilter('used')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'used'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          已使用 ({usedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({allCoupons.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">
              {filter === 'available' && '您目前沒有可用的優惠券'}
              {filter === 'used' && '您還沒有使用過任何優惠券'}
              {filter === 'all' && '您還沒有領取任何優惠券'}
            </p>
            <Link
              href="/coupons"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              去領取優惠券
            </Link>
          </div>
        ) : (
          filteredCoupons.map((userCoupon) => {
            const expired = isExpired(userCoupon)
            const available = isAvailable(userCoupon)

            return (
              <div
                key={userCoupon.id}
                className={`rounded-lg p-6 border-2 relative overflow-hidden ${
                  available
                    ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                {/* 狀態標籤 */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      available
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {getCouponTypeLabel(userCoupon.coupon.type)}
                  </span>
                  {userCoupon.isUsed && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                      已使用
                    </span>
                  )}
                  {expired && !userCoupon.isUsed && (
                    <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded">
                      已過期
                    </span>
                  )}
                </div>

                {/* 優惠金額 */}
                <div className="mb-4">
                  <div
                    className={`text-3xl font-bold mb-2 ${
                      available ? 'text-primary-600' : 'text-gray-400'
                    }`}
                  >
                    {formatCouponValue(userCoupon.coupon)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {userCoupon.coupon.name}
                  </h3>
                  {userCoupon.coupon.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {userCoupon.coupon.description}
                    </p>
                  )}
                </div>

                {/* 使用條件 */}
                <div className="space-y-1 text-sm text-gray-700 mb-4">
                  {userCoupon.coupon.minAmount && (
                    <p>
                      滿 NT$ {Number(userCoupon.coupon.minAmount).toLocaleString()} 可用
                    </p>
                  )}
                  {userCoupon.coupon.maxDiscount && userCoupon.coupon.type === 'PERCENTAGE' && (
                    <p>
                      最高折抵 NT${' '}
                      {Number(userCoupon.coupon.maxDiscount).toLocaleString()}
                    </p>
                  )}
                  <p>
                    有效期至{' '}
                    {new Date(userCoupon.coupon.validUntil).toLocaleDateString('zh-TW')}
                  </p>
                  {userCoupon.usedAt && (
                    <p className="text-green-600">
                      使用時間:{' '}
                      {new Date(userCoupon.usedAt).toLocaleDateString('zh-TW')}
                    </p>
                  )}
                </div>

                {/* 優惠碼 */}
                <div
                  className={`p-3 rounded-lg border-2 border-dashed ${
                    available
                      ? 'bg-white border-primary-300'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <p className="text-xs text-gray-600 mb-1">優惠碼</p>
                  <p
                    className={`text-lg font-mono font-bold ${
                      available ? 'text-primary-600' : 'text-gray-400'
                    }`}
                  >
                    {userCoupon.coupon.code}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Link
        href="/profile"
        className="inline-block mt-6 text-primary-600 hover:text-primary-700"
      >
        ← 返回個人中心
      </Link>
    </div>
  )
}
