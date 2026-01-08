'use client'

import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Copy, Check } from 'lucide-react'
import AccountHeader from '@/components/navigation/AccountHeader'

const GET_MY_REFERRAL = gql`
  query GetMyReferral {
    myReferralCode {
      id
      code
      usedCount
      referrerReward
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

  const { data, loading, error } = useQuery(GET_MY_REFERRAL, {
    skip: !user,
  })

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-gray-500">請先登入查看邀請碼</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-gray-400">載入中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-red-500">錯誤：{error.message}</p>
      </div>
    )
  }

  const referralCode = data?.myReferralCode
  const stats = data?.referralStats

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
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-xl mx-auto">
          {/* 標題 */}
          <h1 className="text-2xl font-bold mb-6">邀請好友</h1>

          {/* 複製連結按鈕 */}
          <div className="mb-8">
            <button
              onClick={handleCopy}
              className="w-full bg-black text-white py-4 px-6 font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              {copySuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  已複製連結
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  複製邀請連結
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2 text-center">
              你的邀請碼：{referralCode?.code}
            </p>
          </div>

          {/* 累計統計 */}
          <div className="border border-gray-200 p-6 mb-8">
            <h2 className="font-medium mb-4">累計獎勵</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
                <div className="text-sm text-gray-500">成功邀請</div>
              </div>
              <div>
                <div className="text-2xl font-bold">${stats?.totalRewards || 0}</div>
                <div className="text-sm text-gray-500">已獲得</div>
              </div>
              <div>
                <div className="text-2xl font-bold">${stats?.pendingRewards || 0}</div>
                <div className="text-sm text-gray-500">待發放</div>
              </div>
            </div>
          </div>

          {/* 說明 */}
          <div className="text-sm text-gray-600 space-y-2">
            <h2 className="font-medium text-black mb-3">說明</h2>
            <p>1. 複製上方連結分享給好友</p>
            <p>2. 好友透過連結訪問並完成訂單</p>
            <p>3. 你將獲得 <span className="font-medium text-black">${referralCode?.referrerReward}</span> 購物金獎勵</p>
            <p className="text-gray-400 mt-4">邀請碼永不過期，無使用上限</p>
          </div>
        </div>
      </div>
    </>
  )
}
