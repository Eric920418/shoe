'use client'

/**
 * 後台邀請碼全局設定管理
 */

import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GET_REFERRAL_SETTINGS = gql`
  query GetReferralSettings {
    referralSettings {
      id
      isEnabled
      rewardAmount
      minOrderAmount
      maxRewardsPerReferee
      rewardType
      rewardPercentage
      maxRewardPerOrder
      creditValidityDays
      description
    }
    referralGlobalStats {
      totalUsers
      totalReferralCodes
      totalReferrals
      successfulOrders
      totalRewardAmount
      pendingRewardAmount
      averageRewardPerOrder
      topReferrers {
        userId
        userName
        referralCount
        totalRewards
      }
    }
    referralCodes(take: 20) {
      items {
        id
        code
        usedCount
        totalRewards
        createdAt
        user {
          id
          name
          email
        }
        usages {
          id
          rewardAmount
          rewardGranted
          orderAmount
          createdAt
          referee {
            id
            name
          }
        }
      }
    }
  }
`

const UPDATE_REFERRAL_SETTINGS = gql`
  mutation UpdateReferralSettings($input: UpdateReferralSettingsInput!) {
    updateReferralSettings(input: $input) {
      id
      isEnabled
      rewardAmount
      minOrderAmount
      maxRewardsPerReferee
      rewardType
      rewardPercentage
      maxRewardPerOrder
      creditValidityDays
      description
    }
  }
`

export default function ReferralSettingsPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<any>(null)

  const { data, loading, refetch } = useQuery(GET_REFERRAL_SETTINGS, {
    onCompleted: (data) => {
      setFormData(data.referralSettings)
    },
  })

  const [updateSettings, { loading: updating }] = useMutation(UPDATE_REFERRAL_SETTINGS, {
    onCompleted: () => {
      alert('設定已更新')
      refetch()
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    await updateSettings({
      variables: {
        input: {
          isEnabled: formData.isEnabled,
          rewardAmount: parseFloat(formData.rewardAmount),
          minOrderAmount: parseFloat(formData.minOrderAmount),
          maxRewardsPerReferee: parseInt(formData.maxRewardsPerReferee),
          rewardType: formData.rewardType,
          rewardPercentage: parseFloat(formData.rewardPercentage),
          maxRewardPerOrder: formData.maxRewardPerOrder ? parseFloat(formData.maxRewardPerOrder) : null,
          creditValidityDays: parseInt(formData.creditValidityDays),
          description: formData.description,
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">載入中...</p>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="p-8">
        <p className="text-red-600">無法載入設定</p>
      </div>
    )
  }

  const stats = data?.referralGlobalStats

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">邀請碼系統設定</h1>
        <p className="text-gray-600 mt-2">配置邀請碼獎勵規則和限制</p>
      </div>

      {/* 統計數據面板 */}
      {stats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">系統統計</h2>

          {/* 關鍵指標 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <div className="text-sm font-medium text-blue-600 mb-1">總用戶數</div>
              <div className="text-3xl font-bold text-blue-900">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-blue-600 mt-1">{stats.totalReferralCodes} 個邀請碼</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
              <div className="text-sm font-medium text-green-600 mb-1">成功邀請</div>
              <div className="text-3xl font-bold text-green-900">{stats.totalReferrals.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">{stats.successfulOrders} 筆訂單</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
              <div className="text-sm font-medium text-purple-600 mb-1">已發放獎勵</div>
              <div className="text-3xl font-bold text-purple-900">${stats.totalRewardAmount.toLocaleString()}</div>
              <div className="text-xs text-purple-600 mt-1">平均 ${stats.averageRewardPerOrder.toFixed(0)}/單</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
              <div className="text-sm font-medium text-orange-600 mb-1">待發放獎勵</div>
              <div className="text-3xl font-bold text-orange-900">${stats.pendingRewardAmount.toLocaleString()}</div>
              <div className="text-xs text-orange-600 mt-1">等待訂單完成</div>
            </div>
          </div>

          {/* 前 10 名邀請者 */}
          {stats.topReferrers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 邀請排行榜 Top 10</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">排名</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">用戶</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">邀請人數</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">獲得獎勵</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topReferrers.map((referrer, index) => (
                      <tr key={referrer.userId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{referrer.userName}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{referrer.referralCount} 人</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          ${referrer.totalRewards.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 最近邀請活動 */}
          {data?.referralCodes?.items && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 最近邀請活動（最新 20 筆）</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">邀請碼</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">邀請者</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">使用次數</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">總獎勵</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">最近使用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referralCodes.items
                      .filter((code: any) => code.usedCount > 0)
                      .slice(0, 10)
                      .map((code: any) => {
                        const latestUsage = code.usages[0]
                        return (
                          <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="font-mono font-semibold text-blue-600">{code.code}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">{code.user.name}</div>
                              <div className="text-xs text-gray-500">{code.user.email}</div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700">{code.usedCount} 次</td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600">
                              ${code.totalRewards.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {latestUsage ? (
                                <div className="text-sm">
                                  <div className="text-gray-900">{latestUsage.referee?.name || '未知'}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(latestUsage.createdAt).toLocaleDateString('zh-TW')}
                                    {latestUsage.orderAmount && ` · $${latestUsage.orderAmount}`}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">無記錄</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 設定表單 */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">獎勵規則設定</h2>
      <form onSubmit={handleSubmit} className="max-w-4xl bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* 系統啟用 */}
        <div className="mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isEnabled}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
            <div>
              <span className="text-lg font-semibold text-gray-900">啟用邀請碼系統</span>
              <p className="text-sm text-gray-600">關閉後將不再發放邀請獎勵</p>
            </div>
          </label>
        </div>

        {/* 獎勵類型 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            獎勵類型
          </label>
          <select
            value={formData.rewardType}
            onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="FIXED">固定金額</option>
            <option value="PERCENTAGE">訂單百分比</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            固定金額：每筆訂單給予固定獎勵；百分比：根據訂單金額計算
          </p>
        </div>

        {/* 獎勵金額 */}
        {formData.rewardType === 'FIXED' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              固定獎勵金額 ($)
            </label>
            <input
              type="number"
              value={formData.rewardAmount}
              onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>
        )}

        {/* 獎勵百分比 */}
        {formData.rewardType === 'PERCENTAGE' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                獎勵百分比 (%)
              </label>
              <input
                type="number"
                value={formData.rewardPercentage}
                onChange={(e) => setFormData({ ...formData, rewardPercentage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                例如：5% 表示訂單金額的 5% 作為獎勵
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                單筆訂單最大獎勵 ($)
              </label>
              <input
                type="number"
                value={formData.maxRewardPerOrder || ''}
                onChange={(e) => setFormData({ ...formData, maxRewardPerOrder: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                placeholder="不限制"
              />
              <p className="text-sm text-gray-500 mt-1">
                留空表示不限制（僅適用於百分比模式）
              </p>
            </div>
          </>
        )}

        {/* 訂單金額門檻 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            訂單金額門檻 ($)
          </label>
          <input
            type="number"
            value={formData.minOrderAmount}
            onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            訂單金額需達到此門檻才發放獎勵（0 = 無門檻）
          </p>
        </div>

        {/* 獎勵次數上限 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            每人獎勵次數上限
          </label>
          <input
            type="number"
            value={formData.maxRewardsPerReferee}
            onChange={(e) => setFormData({ ...formData, maxRewardsPerReferee: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            單一被邀請人最多觸發幾次獎勵（0 = 無限制）
          </p>
        </div>

        {/* 購物金有效期 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            購物金有效期（天）
          </label>
          <input
            type="number"
            value={formData.creditValidityDays}
            onChange={(e) => setFormData({ ...formData, creditValidityDays: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            發放的購物金將在幾天後過期
          </p>
        </div>

        {/* 說明 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            說明
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="選填：設定說明或備註"
          />
        </div>

        {/* 按鈕 */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={updating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {updating ? '儲存中...' : '儲存設定'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            返回
          </button>
        </div>
      </form>
    </div>
  )
}
