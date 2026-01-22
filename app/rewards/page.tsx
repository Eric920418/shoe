'use client'

import React from 'react'
import { useQuery, gql } from '@apollo/client'
import { Gift, Star, TrendingUp, Coins, Sparkles, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const GET_REWARDS_PAGE_CONFIG = gql`
  query GetRewardsPageConfig {
    rewardsPageConfig {
      benefits {
        id
        icon
        title
        description
      }
      usageNotes {
        id
        content
      }
      membershipTiers {
        id
        name
        slug
        minSpent
        maxSpent
        pointsMultiplier
        color
      }
    }
  }
`

// 預設資料（當資料庫沒有資料時使用）
const defaultBenefits = [
  { id: 'default-1', icon: 'Coins', title: '消費自動回饋', description: '每消費 $100 自動獲得 $1 購物金' },
  { id: 'default-2', icon: 'TrendingUp', title: '會員等級加成', description: '等級越高，回饋倍率越多' },
  { id: 'default-3', icon: 'CheckCircle', title: '無需兌換', description: '購物金直接入帳，下次結帳可用' },
  { id: 'default-4', icon: 'Gift', title: '升級獎勵', description: '會員升級額外贈送購物金' },
]

const defaultUsageNotes = [
  { id: 'default-1', content: '訂單完成後自動發放，無需手動兌換' },
  { id: 'default-2', content: '結帳時可選擇使用購物金折抵' },
  { id: 'default-3', content: '購物金有效期為發放後一年' },
  { id: 'default-4', content: '可於「帳戶設定」查看購物金餘額' },
]

const defaultMemberLevels = [
  { id: 'default-1', name: '銅牌會員', slug: 'bronze', minSpent: '0', maxSpent: '9999', pointsMultiplier: '1', color: '#CD7F32' },
  { id: 'default-2', name: '銀牌會員', slug: 'silver', minSpent: '10000', maxSpent: '49999', pointsMultiplier: '1.5', color: '#C0C0C0' },
  { id: 'default-3', name: '金牌會員', slug: 'gold', minSpent: '50000', maxSpent: '99999', pointsMultiplier: '2', color: '#FFD700' },
  { id: 'default-4', name: '白金會員', slug: 'platinum', minSpent: '100000', maxSpent: '199999', pointsMultiplier: '2.5', color: '#A855F7' },
  { id: 'default-5', name: '鑽石會員', slug: 'diamond', minSpent: '200000', maxSpent: null, pointsMultiplier: '3', color: '#06B6D4' },
]

// 圖標映射
const iconMap: { [key: string]: React.ElementType } = {
  Coins,
  TrendingUp,
  CheckCircle,
  Gift,
  Star,
  Sparkles,
}

// 等級對應的漸層顏色
const getLevelGradient = (slug: string, color: string | null) => {
  const gradientMap: { [key: string]: string } = {
    bronze: 'from-amber-600 to-orange-700',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600',
    diamond: 'from-cyan-400 to-blue-500',
  }
  return gradientMap[slug] || 'from-gray-400 to-gray-600'
}

export default function RewardsPage() {
  const { data, loading } = useQuery(GET_REWARDS_PAGE_CONFIG)

  // 使用資料庫數據，如果沒有則使用預設數據
  const benefits = data?.rewardsPageConfig?.benefits?.length > 0
    ? data.rewardsPageConfig.benefits
    : defaultBenefits

  const usageNotes = data?.rewardsPageConfig?.usageNotes?.length > 0
    ? data.rewardsPageConfig.usageNotes
    : defaultUsageNotes

  const memberLevels = data?.rewardsPageConfig?.membershipTiers?.length > 0
    ? data.rewardsPageConfig.membershipTiers
    : defaultMemberLevels

  // 格式化消費範圍
  const formatSpentRange = (min: string, max: string | null) => {
    const minVal = parseInt(min).toLocaleString()
    if (!max) return `$${minVal}+`
    const maxVal = parseInt(max).toLocaleString()
    return `$${minVal} - $${maxVal}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

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
            {benefits.map((benefit: any) => {
              const IconComponent = iconMap[benefit.icon] || Gift
              return (
                <div key={benefit.id} className="text-center p-4 bg-emerald-50 rounded-lg">
                  <IconComponent className="mx-auto mb-2 text-emerald-600" size={28} />
                  <h4 className="font-medium text-gray-800">{benefit.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                </div>
              )
            })}
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
            {memberLevels.map((level: any) => (
              <div key={level.id} className="relative rounded-lg overflow-hidden">
                <div className={`h-28 bg-gradient-to-r ${getLevelGradient(level.slug, level.color)} p-3 text-white`}>
                  <p className="font-bold">{level.name}</p>
                  <p className="text-xs opacity-90">{formatSpentRange(level.minSpent, level.maxSpent)}</p>
                  <p className="text-xl font-bold mt-2">回饋 {level.pointsMultiplier}x</p>
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
            {usageNotes.map((note: any) => (
              <li key={note.id} className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                <span>{note.content}</span>
              </li>
            ))}
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
