'use client'

import React, { useState } from 'react'
import { Award, Trophy, Gift, Star, TrendingUp, Coins, Target, Sparkles } from 'lucide-react'

export default function RewardsPage() {
  const [userPoints] = useState(2580)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const memberLevels = [
    { level: 'BRONZE', name: '銅牌會員', points: '0-999', multiplier: '1x', color: 'from-amber-600 to-orange-700' },
    { level: 'SILVER', name: '銀牌會員', points: '1000-4999', multiplier: '1.5x', color: 'from-gray-400 to-gray-600' },
    { level: 'GOLD', name: '金牌會員', points: '5000-9999', multiplier: '2x', color: 'from-yellow-400 to-yellow-600' },
    { level: 'PLATINUM', name: '白金會員', points: '10000+', multiplier: '3x', color: 'from-purple-400 to-purple-600' }
  ]

  const rewardItems = [
    { id: 1, name: '$50 購物金', points: 500, category: 'voucher', icon: '💰' },
    { id: 2, name: '$100 購物金', points: 900, category: 'voucher', icon: '💰' },
    { id: 3, name: '免運券', points: 200, category: 'shipping', icon: '📦' },
    { id: 4, name: '生日禮包', points: 800, category: 'special', icon: '🎂' },
    { id: 5, name: '品牌購物袋', points: 300, category: 'gift', icon: '🛍️' },
    { id: 6, name: 'VIP 優先購買權', points: 1500, category: 'special', icon: '👑' }
  ]

  const earnMethods = [
    { title: '購物消費', desc: '每$100獲得10積分', icon: '🛒' },
    { title: '商品評價', desc: '每則評價獲得50積分', icon: '⭐' },
    { title: '邀請好友', desc: '好友每次消費獲得200積分', icon: '👥' },
    { title: '生日月', desc: '生日月消費積分2倍', icon: '🎉' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Trophy className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">積分獎勵中心</h1>
            <p className="opacity-90">消費賺積分，積分當現金</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 用戶積分狀態 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600 mb-2">你的積分餘額</p>
              <p className="text-4xl font-bold text-orange-600">{userPoints.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">即將過期：300積分（30天後）</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium">
                兌換獎勵
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium">
                積分記錄
              </button>
            </div>
          </div>
        </div>

        {/* 會員等級 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" />
            會員等級
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {memberLevels.map((level) => (
              <div key={level.level} className="relative rounded-lg overflow-hidden">
                <div className={`h-24 bg-gradient-to-r ${level.color} p-3 text-white`}>
                  <p className="font-bold">{level.name}</p>
                  <p className="text-sm opacity-90">{level.points} 積分</p>
                  <p className="text-lg font-bold mt-1">積分 {level.multiplier}</p>
                </div>
                {level.points === '1000-4999' && (
                  <div className="absolute top-1 right-1 bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-bold">
                    當前
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 獎勵兌換 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gift className="text-purple-500" />
              獎勵兌換
            </h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="all">全部獎勵</option>
              <option value="voucher">購物金</option>
              <option value="shipping">運費券</option>
              <option value="gift">實物禮品</option>
              <option value="special">特殊權益</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {rewardItems
              .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
              .map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h3 className="font-medium text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-orange-600 font-bold mb-3">{item.points} 積分</p>
                  <button
                    className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                      userPoints >= item.points
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={userPoints < item.points}
                  >
                    {userPoints >= item.points ? '立即兌換' : '積分不足'}
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* 賺取積分方式 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Coins className="text-green-500" />
            如何賺取積分
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnMethods.map((method, idx) => (
              <div key={idx} className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">{method.icon}</div>
                <h4 className="font-medium text-gray-800">{method.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{method.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}