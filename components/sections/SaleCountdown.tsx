'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Flame, Gift, TrendingUp } from 'lucide-react'

const SaleCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white py-1.5 sm:py-2 overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 animate-pulse">
            <Flame size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="font-bold text-xs sm:text-sm">限時特賣</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Gift size={16} />
            <span>全場5折起！買越多省越多！</span>
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

          <div className="hidden xl:flex items-center gap-2 ml-4">
            <TrendingUp size={16} />
            <span className="text-sm">已售出 12,345 件</span>
          </div>
        </div>
      </div>

      {/* 滾動文字效果 */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="animate-marquee whitespace-nowrap text-white/10 text-6xl font-bold">
          限時特賣 • SALE • 限時特賣 • SALE • 限時特賣 • SALE •
        </div>
      </div>
    </div>
  )
}

export default SaleCountdown