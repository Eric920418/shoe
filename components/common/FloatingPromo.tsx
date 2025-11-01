'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUp, MessageCircle, ShoppingCart } from 'lucide-react'

const FloatingPromo = () => {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [cartCount] = useState(5) // 這裡應該從全局狀態獲取

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

      {/* 左側邀請獎勵 - 手機版和平板隱藏 */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
        <Link href="/account/referral">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-lg shadow-lg max-w-[120px] text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-3xl mb-2">🎁</div>
            <p className="text-xs font-bold mb-1">邀請好友</p>
            <p className="text-[10px]">賺購物金</p>
            <div className="mt-2 bg-yellow-400 text-purple-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-300 transition-colors">
              立即邀請
            </div>
          </div>
        </Link>
      </div>
    </>
  )
}

export default FloatingPromo