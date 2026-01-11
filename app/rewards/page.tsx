'use client'

import React from 'react'
import { Gift, Star, TrendingUp, Coins, Sparkles, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function RewardsPage() {
  const memberLevels = [
    { level: 'BRONZE', name: '銅牌會員', spent: '$0 - $9,999', multiplier: '1x', color: 'from-amber-600 to-orange-700' },
    { level: 'SILVER', name: '銀牌會員', spent: '$10,000 - $49,999', multiplier: '1.5x', color: 'from-gray-400 to-gray-600' },
    { level: 'GOLD', name: '金牌會員', spent: '$50,000 - $99,999', multiplier: '2x', color: 'from-yellow-400 to-yellow-600' },
    { level: 'PLATINUM', name: '白金會員', spent: '$100,000 - $199,999', multiplier: '2.5x', color: 'from-purple-400 to-purple-600' },
    { level: 'DIAMOND', name: '鑽石會員', spent: '$200,000+', multiplier: '3x', color: 'from-cyan-400 to-blue-500' }
  ]

  const benefits = [
    { title: '消費自動回饋', desc: '每消費 $100 自動獲得 $1 購物金', icon: Coins },
    { title: '會員等級加成', desc: '等級越高，回饋倍率越多', icon: TrendingUp },
    { title: '無需兌換', desc: '購物金直接入帳，下次結帳可用', icon: CheckCircle },
    { title: '升級獎勵', desc: '會員升級額外贈送購物金', icon: Gift },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Sparkles className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">購物金回饋</h1>
            <p className="opacity-90">消費自動回饋，簡單明瞭</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 回饋規則 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
              <span className="text-3xl font-bold text-emerald-600">1%</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">消費回饋</h2>
            <p className="text-gray-600 text-lg">
              每消費 <span className="font-bold text-emerald-600">$100</span> 自動獲得{' '}
              <span className="font-bold text-emerald-600">$1</span> 購物金
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center p-4 bg-emerald-50 rounded-lg">
                <benefit.icon className="mx-auto mb-2 text-emerald-600" size={28} />
                <h4 className="font-medium text-gray-800">{benefit.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 會員等級回饋倍率 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" />
            會員等級回饋倍率
          </h2>
          <p className="text-gray-600 mb-4">
            會員等級越高，購物金回饋倍率越多！
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {memberLevels.map((level) => (
              <div key={level.level} className="relative rounded-lg overflow-hidden">
                <div className={`h-28 bg-gradient-to-r ${level.color} p-3 text-white`}>
                  <p className="font-bold">{level.name}</p>
                  <p className="text-xs opacity-90">{level.spent}</p>
                  <p className="text-xl font-bold mt-2">回饋 {level.multiplier}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>範例：</strong>金牌會員消費 $1,000，基礎回饋 $10，加上 2 倍加成 = 獲得 <strong>$20 購物金</strong>
            </p>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="text-purple-500" />
            購物金使用說明
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>訂單完成後自動發放，無需手動兌換</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>結帳時可選擇使用購物金折抵</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>購物金有效期為發放後一年</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>可於「帳戶設定」查看購物金餘額</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/products"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            立即選購
          </Link>
        </div>
      </div>
    </div>
  )
}
