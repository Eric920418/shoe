'use client'

import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Users, DollarSign, Clock, Copy, Check, Share2, ChevronRight } from 'lucide-react'
import AccountHeader from '@/components/navigation/AccountHeader'

const GET_MY_REFERRAL = gql`
  query GetMyReferral {
    myReferralCode {
      id
      code
      usedCount
      referrerReward
      usages {
        id
        createdAt
        rewardGranted
        referee {
          name
          email
        }
      }
    }
    referralStats {
      totalReferrals
      totalRewards
      pendingRewards
    }
  }
`

export default function ReferralPage() {
  const { user } = useAuth()
  const [copySuccess, setCopySuccess] = useState(false)

  const { data, loading } = useQuery(GET_MY_REFERRAL, {
    skip: !user,
  })

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl font-black mb-4 tracking-tighter">MEMBERS ONLY</div>
          <p className="text-gray-400 text-lg">請先登入查看邀請碼</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400 tracking-widest animate-pulse">LOADING...</div>
        </div>
      </div>
    )
  }

  const referralCode = data?.myReferralCode
  const stats = data?.referralStats

  // 生成邀請連結
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${referralCode?.code}`
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('複製失敗，請手動複製')
    }
  }

  return (
    <>
      <AccountHeader />
      <div className="min-h-screen bg-white">
      {/* Hero Section - Black Background */}
      <div className="bg-black text-white py-16 px-4 relative overflow-hidden">
        {/* Decorative Slash Lines */}
        <div className="absolute top-0 right-0 w-64 h-full bg-white opacity-5 transform skew-x-[-15deg] translate-x-32"></div>
        <div className="absolute top-0 right-20 w-32 h-full bg-white opacity-5 transform skew-x-[-15deg] translate-x-32"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-8">
            <div className="text-xs font-bold tracking-[0.3em] text-gray-400 mb-4">REFERRAL PROGRAM</div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
              INVITE<br/>& EARN
            </h1>
            <div className="w-20 h-1 bg-orange-500 mb-6"></div>
            <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
              分享你的專屬連結，每次好友完成訂單，你都將獲得購物金獎勵
            </p>
          </div>

          {/* Referral Code Display */}
          <div className="mt-12 inline-block">
            <div className="text-xs font-bold tracking-[0.3em] text-gray-500 mb-2">YOUR CODE</div>
            <div className="text-5xl md:text-7xl font-black tracking-tight border-4 border-white px-8 py-4 inline-block transform hover:scale-105 transition-transform">
              {referralCode?.code}
            </div>
            <div className="text-sm text-gray-400 mt-3 font-medium">
              使用 {referralCode?.usedCount || 0} 次 · 無上限 · 永不過期
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - White Background */}
      <div className="py-16 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat 1 */}
            <div className="group">
              <div className="border-2 border-black p-8 transition-all hover:bg-black hover:text-white">
                <Users className="w-10 h-10 mb-4 opacity-50" />
                <div className="text-6xl font-black tracking-tight mb-2">
                  {stats?.totalReferrals || 0}
                </div>
                <div className="text-sm font-bold tracking-[0.2em] uppercase opacity-60">
                  成功邀請
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="group">
              <div className="border-2 border-black p-8 transition-all hover:bg-black hover:text-white">
                <DollarSign className="w-10 h-10 mb-4 opacity-50" />
                <div className="text-6xl font-black tracking-tight mb-2">
                  ${stats?.totalRewards || 0}
                </div>
                <div className="text-sm font-bold tracking-[0.2em] uppercase opacity-60">
                  已獲得獎勵
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="group">
              <div className="border-2 border-black p-8 transition-all hover:bg-black hover:text-white">
                <Clock className="w-10 h-10 mb-4 opacity-50" />
                <div className="text-6xl font-black tracking-tight mb-2">
                  ${stats?.pendingRewards || 0}
                </div>
                <div className="text-sm font-bold tracking-[0.2em] uppercase opacity-60">
                  待發放獎勵
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Share2 className="w-8 h-8" />
              <h2 className="text-4xl font-black tracking-tight">分享連結</h2>
            </div>
            <p className="text-gray-600 text-lg">
              好友完成訂單後，你將獲得 <span className="font-bold text-black">${referralCode?.referrerReward}</span> 購物金
            </p>
          </div>

          {/* URL Input with Copy Button */}
          <div className="bg-white border-2 border-black p-2 flex items-center gap-2">
            <div className="flex-1 px-4 py-4 font-mono text-sm overflow-x-auto whitespace-nowrap">
              {referralUrl}
            </div>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 font-bold tracking-wide uppercase transition-colors flex items-center gap-2"
            >
              {copySuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  複製
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl font-black tracking-tight mb-2">邀請記錄</h2>
            <div className="w-16 h-1 bg-black"></div>
          </div>

          {!referralCode?.usages || referralCode.usages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 p-16 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400 text-lg font-medium">
                還沒有邀請記錄，快去分享你的邀請連結吧！
              </p>
            </div>
          ) : (
            <div className="border-2 border-black overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="px-6 py-4 text-left text-xs font-bold tracking-[0.2em] uppercase">
                      用戶
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold tracking-[0.2em] uppercase">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold tracking-[0.2em] uppercase">
                      註冊時間
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold tracking-[0.2em] uppercase">
                      狀態
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {referralCode.usages.map((usage: any) => (
                    <tr key={usage.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold">
                        {usage.referee.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {usage.referee.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {new Date(usage.createdAt).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold tracking-wide uppercase ${
                            usage.rewardGranted
                              ? 'bg-black text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {usage.rewardGranted ? '已發放' : '待發放'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="text-xs font-bold tracking-[0.3em] text-gray-500 mb-3">HOW IT WORKS</div>
            <h2 className="text-5xl font-black tracking-tight">使用說明</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { num: '01', title: '複製連結', desc: '點擊「複製」按鈕獲取你的專屬邀請連結' },
              { num: '02', title: '分享給好友', desc: '通過社群媒體、Email 或 LINE 分享連結' },
              { num: '03', title: '好友訪問', desc: '好友通過你的連結訪問網站' },
              { num: '04', title: '完成訂單', desc: '好友在網站上完成首次購物訂單' },
              { num: '05', title: '自動發放', desc: `你將自動獲得 $${referralCode?.referrerReward} 購物金獎勵` },
              { num: '06', title: '無限獎勵', desc: '好友每次下單你都能持續獲得獎勵！' },
            ].map((step) => (
              <div key={step.num} className="group">
                <div className="border-2 border-white p-6 hover:bg-white hover:text-black transition-all">
                  <div className="text-5xl font-black mb-4 opacity-30 group-hover:opacity-100 transition-opacity">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-black mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm opacity-70 leading-relaxed">
                    {step.desc}
                  </p>
                  <ChevronRight className="w-6 h-6 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
