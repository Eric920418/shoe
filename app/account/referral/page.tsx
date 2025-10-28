'use client'

import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">請先登入查看邀請碼</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">載入中...</p>
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的邀請碼</h1>
        <p className="text-gray-600 mt-2">分享邀請連結，好友下單後你將獲得購物金獎勵</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-sm text-gray-600">成功邀請</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalReferrals || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              💰
            </div>
            <div>
              <p className="text-sm text-gray-600">已獲得獎勵</p>
              <p className="text-2xl font-bold text-green-600">${stats?.totalRewards || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
              ⏳
            </div>
            <div>
              <p className="text-sm text-gray-600">待發放獎勵</p>
              <p className="text-2xl font-bold text-yellow-600">${stats?.pendingRewards || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 邀請連結 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
        <h2 className="text-2xl font-bold mb-4">分享你的邀請連結</h2>
        <p className="mb-6 opacity-90">
          好友通過你的連結訪問並完成首次下單，你將獲得 ${referralCode?.referrerReward} 購物金獎勵！
        </p>

        <div className="bg-white rounded-lg p-4 flex items-center gap-3">
          <div className="flex-1 text-gray-900 font-mono text-sm overflow-x-auto">
            {referralUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {copySuccess ? '已複製!' : '複製連結'}
          </button>
        </div>

        <div className="mt-4 text-sm opacity-75">
          <p>邀請碼：<span className="font-bold text-lg">{referralCode?.code}</span></p>
          <p className="mt-1">
            使用次數：{referralCode?.usedCount || 0} 次（無上限，永不過期）
          </p>
        </div>
      </div>

      {/* 邀請記錄 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">邀請記錄</h3>
        </div>

        {!referralCode?.usages || referralCode.usages.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            還沒有邀請記錄，快去分享你的邀請連結吧！
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用戶
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    註冊時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    獎勵狀態
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referralCode.usages.map((usage: any) => (
                  <tr key={usage.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {usage.referee.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {usage.referee.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(usage.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          usage.rewardGranted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
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

      {/* 使用說明 */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3">如何使用邀請碼？</h3>
        <ol className="space-y-2 text-blue-800">
          <li>1. 點擊「複製連結」按鈕複製你的專屬邀請連結</li>
          <li>2. 分享連結給你的朋友（可通過社群媒體、Email 等方式）</li>
          <li>3. 朋友通過你的連結訪問網站並完成首次訂單</li>
          <li>4. 訂單完成後，你將自動獲得 ${referralCode?.referrerReward} 購物金獎勵</li>
        </ol>
      </div>
    </div>
  )
}
