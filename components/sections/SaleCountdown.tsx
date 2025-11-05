'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Flame, Gift, TrendingUp } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'

// GraphQL 查詢：獲取促銷倒計時
const GET_SALE_COUNTDOWN = gql`
  query GetSaleCountdown {
    activeSaleCountdown {
      id
      title
      description
      endTime
      highlightText
      link
    }
  }
`

const SaleCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // 查詢促銷倒計時數據
  // 優化：改用 cache-first 減少請求，延長輪詢間隔
  const { data, startPolling, stopPolling } = useQuery(GET_SALE_COUNTDOWN, {
    fetchPolicy: 'cache-first', // 👈 優化：優先使用快取
    nextFetchPolicy: 'cache-first',
  })

  // 動態控制輪詢：有活動才輪詢
  useEffect(() => {
    if (data?.activeSaleCountdown) {
      startPolling(60000) // 有活動才每分鐘輪詢
    } else {
      stopPolling() // 沒有活動停止輪詢
    }

    return () => stopPolling()
  }, [data?.activeSaleCountdown, startPolling, stopPolling])

  const countdown = data?.activeSaleCountdown

  useEffect(() => {
    if (!countdown?.endTime) {
      // 如果沒有後台數據，使用預設倒計時（24小時）
      setTimeLeft({ hours: 23, minutes: 59, seconds: 59 })
      return
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const endTime = new Date(countdown.endTime).getTime()
      const difference = endTime - now

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ hours, minutes, seconds })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // 立即更新一次
    updateTimeLeft()

    // 然後每秒更新
    const timer = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // 如果沒有活躍的促銷倒計時，不顯示組件
  if (!countdown && data !== undefined) {
    return null
  }

  // 使用後台數據或預設數據
  const title = countdown?.title || '限時特賣'
  const description = countdown?.description || '全場5折起！買越多省越多！'
  const highlightText = countdown?.highlightText || '限時特賣 • SALE'

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white py-1.5 sm:py-2 overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 animate-pulse">
            <Flame size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="font-bold text-xs sm:text-sm">{title}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Gift size={16} />
            <span>{description}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium hidden lg:inline">距離活動結束</span>
          <div className="flex items-center gap-1">
            <Clock size={14} className="sm:w-4 sm:h-4" />
            <div className="flex gap-0.5 sm:gap-1 text-xs sm:text-sm font-bold">
              <span className="bg-black/30 px-1 sm:px-2 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span className="bg-black/30 px-1 sm:px-2 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span className="bg-black/30 px-1 sm:px-2 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 滾動文字效果 */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="animate-marquee whitespace-nowrap text-white/10 text-6xl font-bold">
          {highlightText} • {highlightText} • {highlightText} •
        </div>
      </div>
    </div>
  )
}

export default SaleCountdown