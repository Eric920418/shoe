'use client'

/**
 * 錢包頁面 - 查看購物金和優惠券
 * Nike/Adidas 極簡風格設計
 *
 * 功能：
 * 1. 分頁顯示購物金和優惠券
 * 2. 顯示購物金餘額、有效期限、使用限制
 * 3. 顯示優惠券狀態（可用/已使用/已過期）
 * 4. 顯示總可用金額統計
 */

import { useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import Link from 'next/link'

// GraphQL Queries
const GET_MY_CREDITS = gql`
  query GetMyCredits {
    myCredits {
      id
      amount
      balance
      source
      sourceId
      minOrderAmount
      maxUsagePerOrder
      validFrom
      validUntil
      isActive
      isUsed
      createdAt
    }
    availableCreditAmount
  }
`

const GET_MY_COUPONS = gql`
  query GetMyCoupons {
    myCoupons {
      id
      isUsed
      usedAt
      obtainedFrom
      expiresAt
      createdAt
      coupon {
        id
        code
        name
        description
        type
        value
        minAmount
        maxDiscount
        validFrom
        validUntil
        isActive
      }
    }
    availableCoupons {
      id
      isUsed
      coupon {
        id
        code
        name
        description
        type
        value
        minAmount
        maxDiscount
      }
    }
  }
`

// 來源標籤（極簡黑白風格）
const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    ACTIVITY: '活動贈送',
    REFUND: '退款',
    ADMIN_GRANT: '管理員發放',
    BIRTHDAY: '生日禮金',
    REVIEW: '評價獎勵',
    REFERRAL: '邀請獎勵',
    MEMBERSHIP_UPGRADE: '會員升級',
  }
  return labels[source] || source
}

// 優惠券類型標籤
const getCouponTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    PERCENTAGE: '折扣',
    FIXED: '現金',
    FREE_SHIPPING: '免運',
    BUY_X_GET_Y: '買贈',
  }
  return labels[type] || type
}

// 優惠券折扣顯示
const getCouponValueDisplay = (type: string, value: number) => {
  switch (type) {
    case 'PERCENTAGE':
      return `${value}折`
    case 'FIXED':
      return `NT$ ${value}`
    case 'FREE_SHIPPING':
      return '免運'
    default:
      return value
  }
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'credits' | 'coupons'>('credits')

  // 查詢購物金
  const {
    data: creditsData,
    loading: creditsLoading,
    error: creditsError,
  } = useQuery(GET_MY_CREDITS, {
    fetchPolicy: 'network-only',
  })

  // 查詢優惠券
  const {
    data: couponsData,
    loading: couponsLoading,
    error: couponsError,
  } = useQuery(GET_MY_COUPONS, {
    fetchPolicy: 'network-only',
  })

  const loading = creditsLoading || couponsLoading

  // 錯誤處理
  if (creditsError || couponsError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border border-black p-6">
            <p className="text-black font-medium">載入失敗</p>
            <p className="text-gray-600 mt-2 text-sm">
              {creditsError?.message || couponsError?.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const myCredits = creditsData?.myCredits || []
  const availableCreditAmount = creditsData?.availableCreditAmount || 0
  const myCoupons = couponsData?.myCoupons || []
  const availableCoupons = couponsData?.availableCoupons || []

  // 分類優惠券
  const now = new Date()
  const activeCoupons = myCoupons.filter(
    (uc: any) =>
      !uc.isUsed &&
      uc.coupon.isActive &&
      new Date(uc.coupon.validFrom) <= now &&
      new Date(uc.coupon.validUntil) >= now &&
      (!uc.expiresAt || new Date(uc.expiresAt) >= now)
  )
  const usedCoupons = myCoupons.filter((uc: any) => uc.isUsed)
  const expiredCoupons = myCoupons.filter(
    (uc: any) =>
      !uc.isUsed &&
      (new Date(uc.coupon.validUntil) < now ||
        (uc.expiresAt && new Date(uc.expiresAt) < now))
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 標題 */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight">錢包</h1>
          <p className="mt-3 text-gray-600 text-lg">管理您的購物金和優惠券</p>
        </div>

        {/* 統計卡片 - 極簡黑白風格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 購物金總額 */}
          <div className="border-2 border-black bg-white p-8 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 uppercase tracking-wider mb-2">
                  可用購物金
                </p>
                <p className="text-4xl font-bold text-black mb-1">
                  NT$ {availableCreditAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{myCredits.length} 筆購物金</p>
              </div>
            </div>
          </div>

          {/* 優惠券數量 */}
          <div className="border-2 border-black bg-white p-8 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 uppercase tracking-wider mb-2">
                  可用優惠券
                </p>
                <p className="text-4xl font-bold text-black mb-1">
                  {activeCoupons.length} <span className="text-2xl">張</span>
                </p>
                <p className="text-sm text-gray-500">總共 {myCoupons.length} 張優惠券</p>
              </div>
            </div>
          </div>
        </div>

        {/* 分頁切換 - 極簡風格 */}
        <div className="border-b-2 border-gray-200 mb-12">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('credits')}
              className={`pb-4 text-lg font-medium transition-all relative ${
                activeTab === 'credits'
                  ? 'text-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              購物金 ({myCredits.length})
              {activeTab === 'credits' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`pb-4 text-lg font-medium transition-all relative ${
                activeTab === 'coupons'
                  ? 'text-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              優惠券 ({myCoupons.length})
              {activeTab === 'coupons' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
              )}
            </button>
          </nav>
        </div>

        {/* 內容區 */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : activeTab === 'credits' ? (
            // 購物金列表
            <div className="space-y-4">
              {myCredits.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200">
                  <p className="text-2xl font-bold text-black mb-2">還沒有購物金</p>
                  <p className="text-gray-600 mb-6">
                    購物金可通過活動、評價、邀請好友等方式獲得
                  </p>
                  <Link
                    href="/account/referral"
                    className="inline-block bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors"
                  >
                    立即邀請好友
                  </Link>
                </div>
              ) : (
                myCredits.map((credit: any) => {
                  const isExpiringSoon =
                    new Date(credit.validUntil).getTime() - Date.now() <
                    7 * 24 * 60 * 60 * 1000
                  const sourceLabel = getSourceLabel(credit.source)

                  return (
                    <div
                      key={credit.id}
                      className="border border-gray-200 p-6 hover:border-black transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs uppercase tracking-wider text-gray-600 font-medium">
                            {sourceLabel}
                          </span>
                          {isExpiringSoon && (
                            <span className="text-xs uppercase tracking-wider bg-black text-white px-2 py-1 font-medium">
                              即將到期
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-black">
                            {Number(credit.balance).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">NT$</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                        {credit.minOrderAmount && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                              最低訂單
                            </p>
                            <p className="text-sm font-medium text-black">
                              NT$ {Number(credit.minOrderAmount).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {credit.maxUsagePerOrder && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                              單筆上限
                            </p>
                            <p className="text-sm font-medium text-black">
                              NT$ {Number(credit.maxUsagePerOrder).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            有效期限
                          </p>
                          <p className="text-sm font-medium text-black">
                            {format(new Date(credit.validFrom), 'yyyy/MM/dd')} -{' '}
                            {format(new Date(credit.validUntil), 'yyyy/MM/dd')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            // 優惠券列表
            <div className="space-y-12">
              {/* 可用優惠券 */}
              {activeCoupons.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">
                    可用優惠券 ({activeCoupons.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeCoupons.map((uc: any) => {
                      const { coupon } = uc

                      return (
                        <div
                          key={uc.id}
                          className="border-2 border-black bg-white p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="text-xs uppercase tracking-wider bg-black text-white px-3 py-1 font-medium">
                              {getCouponTypeLabel(coupon.type)}
                            </span>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-black">
                                {getCouponValueDisplay(coupon.type, coupon.value)}
                              </p>
                            </div>
                          </div>

                          <h4 className="text-xl font-bold text-black mb-2">
                            {coupon.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {coupon.description || '無說明'}
                          </p>

                          <div className="space-y-2 pt-4 border-t border-gray-200">
                            {coupon.minAmount && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">最低消費</span>
                                <span className="font-medium text-black">
                                  NT$ {Number(coupon.minAmount).toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">有效期限</span>
                              <span className="font-medium text-black">
                                {format(new Date(coupon.validUntil), 'yyyy/MM/dd')}
                              </span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-1">優惠碼</p>
                              <p className="font-mono font-bold text-black tracking-wider">
                                {coupon.code}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 已使用優惠券 */}
              {usedCoupons.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">
                    已使用 ({usedCoupons.length})
                  </h3>
                  <div className="space-y-3">
                    {usedCoupons.map((uc: any) => (
                      <div
                        key={uc.id}
                        className="border border-gray-200 p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">{uc.coupon.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(uc.usedAt), 'yyyy/MM/dd HH:mm')} 已使用
                            </p>
                          </div>
                          <span className="text-2xl text-gray-300">✓</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已過期優惠券 */}
              {expiredCoupons.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">
                    已過期 ({expiredCoupons.length})
                  </h3>
                  <div className="space-y-3">
                    {expiredCoupons.map((uc: any) => (
                      <div
                        key={uc.id}
                        className="border border-gray-200 p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">{uc.coupon.name}</p>
                            <p className="text-sm text-gray-500 mt-1">已過期</p>
                          </div>
                          <span className="text-2xl text-gray-300">✕</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 空狀態 */}
              {myCoupons.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-gray-200">
                  <p className="text-2xl font-bold text-black mb-2">還沒有優惠券</p>
                  <p className="text-gray-600 mb-6">
                    優惠券可通過活動、領取等方式獲得
                  </p>
                  <Link
                    href="/products"
                    className="inline-block bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors"
                  >
                    立即購物
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
