'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUp, MessageCircle, ShoppingCart, Gift, Star, Zap, Heart, Bell } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'
import { useCart } from '@/contexts/CartContext'

// GraphQL 查詢：獲取浮動促銷按鈕
const GET_FLOATING_PROMOS = gql`
  query GetActiveFloatingPromos {
    activeFloatingPromos {
      id
      type
      text
      link
      icon
      bgColor
      textColor
      position
    }
  }
`

/**
 * 浮動促銷組件
 *
 * 優化說明：
 * ✅ 移除重複的 GET_CART 查詢
 * ✅ 改用統一的 useCart hook（由 CartProvider 管理）
 * ✅ 避免與 MarketplaceHeader 組件重複查詢，減少網路請求
 * ✅ 浮動促銷按鈕改用 cache-first 策略
 */

const FloatingPromo = () => {
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 使用統一的 Cart Context（避免重複查詢）
  const { cartCount } = useCart()

  // 查詢浮動促銷按鈕配置
  const { data } = useQuery(GET_FLOATING_PROMOS, {
    fetchPolicy: 'cache-first', // 👈 優化：改用 cache-first
    nextFetchPolicy: 'cache-first',
  })

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 圖標映射表
  const iconMap: { [key: string]: any } = {
    ShoppingCart,
    MessageCircle,
    Gift,
    Star,
    Zap,
    Heart,
    Bell
  }

  // 處理浮動促銷按鈕
  const floatingPromos = React.useMemo(() => {
    if (data?.activeFloatingPromos && data.activeFloatingPromos.length > 0) {
      return data.activeFloatingPromos
        .filter((promo: any) => promo.position === 'LEFT')
    }
    return []
  }, [data])

  // 渲染促銷按鈕
  const renderPromoButton = (promo: any) => {
    const Icon = iconMap[promo.icon] || Gift

    if (promo.type === 'REFERRAL') {
      return (
        <Link key={promo.id} href={promo.link}>
          <div className={`${promo.bgColor || 'bg-gradient-to-br from-purple-500 to-pink-600'} ${promo.textColor || 'text-white'} p-4 rounded-lg shadow-lg max-w-[120px] text-center hover:scale-105 transition-transform cursor-pointer`}>
            {promo.icon === 'emoji' ? (
              <div className="text-3xl mb-2">🎁</div>
            ) : (
              <Icon size={30} className="mx-auto mb-2" />
            )}
            <p className="text-xs font-bold mb-1">{promo.text || '邀請好友'}</p>
            <p className="text-[10px]">賺購物金</p>
            <div className="mt-2 bg-yellow-400 text-purple-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-300 transition-colors">
              立即邀請
            </div>
          </div>
        </Link>
      )
    }

    if (promo.type === 'PROMOTION') {
      return (
        <Link key={promo.id} href={promo.link}>
          <div className={`${promo.bgColor || 'bg-gradient-to-br from-red-500 to-orange-600'} ${promo.textColor || 'text-white'} p-4 rounded-lg shadow-lg max-w-[120px] text-center hover:scale-105 transition-transform cursor-pointer`}>
            <Icon size={30} className="mx-auto mb-2" />
            <p className="text-xs font-bold">{promo.text}</p>
          </div>
        </Link>
      )
    }

    if (promo.type === 'REWARD') {
      return (
        <Link key={promo.id} href={promo.link}>
          <div className={`${promo.bgColor || 'bg-gradient-to-br from-yellow-500 to-orange-600'} ${promo.textColor || 'text-white'} p-4 rounded-lg shadow-lg max-w-[120px] text-center hover:scale-105 transition-transform cursor-pointer`}>
            <Icon size={30} className="mx-auto mb-2" />
            <p className="text-xs font-bold">{promo.text}</p>
          </div>
        </Link>
      )
    }

    // 預設樣式
    return (
      <Link key={promo.id} href={promo.link}>
        <div className={`${promo.bgColor || 'bg-blue-500'} ${promo.textColor || 'text-white'} p-4 rounded-lg shadow-lg max-w-[120px] text-center hover:scale-105 transition-transform cursor-pointer`}>
          <Icon size={30} className="mx-auto mb-2" />
          <p className="text-xs font-bold">{promo.text}</p>
        </div>
      </Link>
    )
  }

  return (
    <>
      {/* 右側固定按鈕組 */}
      <div className="fixed right-2 sm:right-4 bottom-6 sm:bottom-4 z-50 flex flex-col gap-1.5 sm:gap-2 md:gap-3">
        {/* 購物車 */}
        <Link href="/cart" className="relative bg-orange-500 text-white p-2 sm:p-2.5 md:p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors flex-shrink-0">
          <ShoppingCart size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[9px] sm:text-[10px] md:text-xs w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>

        {/* 客服 */}
        <Link href="/help" className="bg-green-500 text-white p-2 sm:p-2.5 md:p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors flex-shrink-0">
          <MessageCircle size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </Link>

        {/* 回到頂部 */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="bg-gray-600 text-white p-2 sm:p-2.5 md:p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all opacity-80 hover:opacity-100 flex-shrink-0"
          >
            <ArrowUp size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>

      {/* 左側促銷按鈕 */}
      {floatingPromos.length > 0 ? (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3">
          {floatingPromos.map((promo: any) => renderPromoButton(promo))}
        </div>
      ) : (
        // 預設的邀請獎勵按鈕
        <>
          {/* 電腦版 - 完整版本 */}
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
            <Link href="/account/referral">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-lg shadow-lg max-w-[150px] text-center hover:scale-105 transition-transform cursor-pointer">
                <div className="text-3xl mb-2">🎁</div>
                <p className="text-xs font-bold mb-1">邀請好友</p>
                <div className="text-nowrap mt-2 bg-yellow-400 text-purple-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-300 transition-colors">
                  立即邀請
                </div>
              </div>
            </Link>
          </div>
          {/* 手機版 - 精簡版本 */}
          <div className="fixed left-2 bottom-6 z-40 xl:hidden">
            <Link href="/account/referral">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer flex items-center justify-center w-11 h-11">
                <span className="text-xl">🎁</span>
              </div>
            </Link>
          </div>
        </>
      )}
    </>
  )
}

export default FloatingPromo