'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar, Clock, Flame, Star, TrendingUp,
  RefreshCw, Bell, ShoppingCart, Heart
} from 'lucide-react'

export default function DailyDealsPage() {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState({ hours: 14, minutes: 30, seconds: 45 })
  const [selectedDate, setSelectedDate] = useState('today')

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilRefresh(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const dailyDeals = [
    {
      id: 1,
      name: 'Nike Blazer Mid 77',
      originalPrice: 3290,
      dealPrice: 1290,
      image: '/api/placeholder/300/300',
      discount: 61,
      stock: 50,
      sold: 234,
      rating: 4.8,
      dealType: '今日主打'
    },
    {
      id: 2,
      name: 'Adidas NMD R1',
      originalPrice: 4590,
      dealPrice: 1990,
      image: '/api/placeholder/300/300',
      discount: 57,
      stock: 30,
      sold: 189,
      rating: 4.9,
      dealType: '限量特價'
    },
    {
      id: 3,
      name: 'New Balance 530',
      originalPrice: 2990,
      dealPrice: 990,
      image: '/api/placeholder/300/300',
      discount: 67,
      stock: 100,
      sold: 567,
      rating: 4.7,
      dealType: '爆款推薦'
    },
    {
      id: 4,
      name: 'Converse One Star',
      originalPrice: 2490,
      dealPrice: 890,
      image: '/api/placeholder/300/300',
      discount: 64,
      stock: 80,
      sold: 423,
      rating: 4.6,
      dealType: '週末特惠'
    },
    {
      id: 5,
      name: 'Vans Era',
      originalPrice: 2190,
      dealPrice: 790,
      image: '/api/placeholder/300/300',
      discount: 64,
      stock: 60,
      sold: 892,
      rating: 4.7,
      dealType: '熱銷單品'
    },
    {
      id: 6,
      name: 'Puma Clyde',
      originalPrice: 2890,
      dealPrice: 1190,
      image: '/api/placeholder/300/300',
      discount: 59,
      stock: 45,
      sold: 234,
      rating: 4.5,
      dealType: '新品特價'
    }
  ]

  const weekDates = [
    { value: 'today', label: '今日', date: '11/1' },
    { value: 'tomorrow', label: '明日預告', date: '11/2' },
    { value: 'day3', label: '週日', date: '11/3' },
    { value: 'day4', label: '週一', date: '11/4' },
    { value: 'day5', label: '週二', date: '11/5' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="text-white" size={28} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">今日特價</h1>
                <p className="text-xs sm:text-sm opacity-90">每日10點準時更新</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/20 backdrop-blur px-4 py-2 rounded-lg">
              <RefreshCw size={20} />
              <div>
                <p className="text-xs opacity-80">下次更新</p>
                <div className="flex gap-1 text-lg font-bold">
                  <span>{String(timeUntilRefresh.hours).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(timeUntilRefresh.minutes).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(timeUntilRefresh.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 日期選擇 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">選擇日期</h2>
            <button className="text-orange-500 hover:text-orange-600 text-sm flex items-center gap-1">
              <Bell size={16} />
              訂閱提醒
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {weekDates.map(date => (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg text-center transition-colors ${
                  selectedDate === date.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <p className="text-sm font-medium">{date.label}</p>
                <p className="text-xs opacity-80">{date.date}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 特價商品網格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {dailyDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
            >
              <Link href={`/products/${deal.id}`}>
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={deal.image}
                    alt={deal.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* 標籤 */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      {deal.dealType}
                    </span>
                  </div>

                  {/* 折扣 */}
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
                    <span className="text-lg font-bold">{deal.discount}%</span>
                    <span className="text-xs block">OFF</span>
                  </div>

                  {/* 收藏 */}
                  <button className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white">
                    <Heart size={14} className="text-gray-600" />
                  </button>

                  {/* 庫存進度 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-2">
                    <div className="flex justify-between text-white text-[10px] mb-1">
                      <span>已售 {deal.sold}</span>
                      <span>剩餘 {deal.stock}</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        style={{ width: `${(deal.sold / (deal.sold + deal.stock)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                    {deal.name}
                  </h3>

                  <div className="flex items-center gap-1 mb-2">
                    <Star className="text-yellow-400 fill-current" size={12} />
                    <span className="text-xs text-gray-600">{deal.rating}</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 line-through">
                        ${deal.originalPrice}
                      </p>
                      <p className="text-base font-bold text-red-500">
                        ${deal.dealPrice}
                      </p>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs">
                      搶
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* 更多優惠提示 */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 text-center">
          <Clock className="mx-auto text-orange-500 mb-3" size={48} />
          <h3 className="text-lg font-bold text-gray-800 mb-2">更多優惠即將上線</h3>
          <p className="text-sm text-gray-600 mb-4">每日10點準時更新，記得設定提醒不錯過</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            設定提醒
          </button>
        </div>
      </div>
    </div>
  )
}