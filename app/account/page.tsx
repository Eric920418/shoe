'use client'

/**
 * 用戶個人資料頁面
 *
 * 功能：
 * 1. 顯示基本資料（姓名、手機、Email）
 * 2. 顯示 LINE 綁定狀態
 * 3. 可補充手機號碼、Email
 * 4. 可設定密碼（用於非 LINE 登入）
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { gql, useMutation, useQuery } from '@apollo/client'
import Link from 'next/link'

// GraphQL
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      email
      phone
      lineId
      lineDisplayName
      lineProfileImage
      isLineConnected
      membershipTier
      totalSpent
      createdAt
    }
  }
`

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
      phone
    }
  }
`

// 判斷是否為 LINE 臨時 email（系統自動生成的）
const isTemporaryEmail = (email: string | null | undefined): boolean => {
  if (!email) return false
  return email.startsWith('line_') && email.endsWith('@temp.local')
}

// 取得會員等級顯示文字（中文）
const getMembershipTierDisplay = (tier: string | null | undefined): string => {
  const tierUpper = tier?.toUpperCase()
  switch (tierUpper) {
    case 'DIAMOND':
      return '鑽石會員'
    case 'PLATINUM':
      return '白金會員'
    case 'GOLD':
      return '金牌會員'
    case 'SILVER':
      return '銀牌會員'
    case 'BRONZE':
      return '銅牌會員'
    default:
      return '銅牌會員'
  }
}

// 取得會員等級樣式
const getMembershipTierStyles = (tier: string | null | undefined) => {
  const tierUpper = tier?.toUpperCase()
  switch (tierUpper) {
    case 'DIAMOND':
      return {
        gradient: 'from-cyan-400 via-blue-500 to-purple-600',
        icon: '💎',
        textColor: 'text-white'
      }
    case 'PLATINUM':
      return {
        gradient: 'from-gray-300 via-gray-400 to-gray-500',
        icon: '⭐',
        textColor: 'text-white'
      }
    case 'GOLD':
      return {
        gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
        icon: '👑',
        textColor: 'text-white'
      }
    case 'SILVER':
      return {
        gradient: 'from-gray-200 via-gray-300 to-gray-400',
        icon: '🥈',
        textColor: 'text-gray-800'
      }
    case 'BRONZE':
      return {
        gradient: 'from-orange-300 via-orange-400 to-orange-500',
        icon: '🥉',
        textColor: 'text-white'
      }
    default:
      return {
        gradient: 'from-orange-300 via-orange-400 to-orange-500',
        icon: '🥉',
        textColor: 'text-white'
      }
  }
}

export default function AccountPage() {
  const { user: authUser, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const { data, loading, refetch } = useQuery(GET_USER_PROFILE, {
    fetchPolicy: 'network-only', // 強制從伺服器獲取最新資料，不使用快取
    onCompleted: (data) => {
      setFormData({
        name: data.me.name || '',
        email: !isTemporaryEmail(data.me.email) ? data.me.email || '' : '',
        phone: data.me.phone || '',
      })
    },
  })

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      updateUser(data.updateProfile)
      setIsEditing(false)
      alert('資料已更新')
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      variables: {
        input: formData,
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const user = data?.me
  const tierStyles = getMembershipTierStyles(user?.membershipTier)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 側邊欄 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
              {/* 頭像區域 - 漸層背景 */}
              <div className={`bg-gradient-to-r ${tierStyles.gradient} p-6 text-center`}>
                {user?.lineProfileImage ? (
                  <img
                    src={user.lineProfileImage}
                    alt={user.name}
                    className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center text-orange-500 text-3xl font-bold shadow-lg border-4 border-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <h2 className={`mt-4 text-xl font-bold ${tierStyles.textColor} drop-shadow-md`}>
                  {user?.name}
                </h2>
                <p className={`text-xs ${tierStyles.textColor} mt-1 opacity-90`}>
                  {!isTemporaryEmail(user?.email) && user?.email
                    ? user.email
                    : user?.phone || '會員'}
                </p>
              </div>

              <div className="p-5">
                {/* 會員等級徽章 */}
                <div className={`bg-gradient-to-r ${tierStyles.gradient} text-center rounded-xl p-4 shadow-md mb-5`}>
                  <div className="text-3xl mb-2">{tierStyles.icon}</div>
                  <div className={`text-sm font-bold ${tierStyles.textColor}`}>
                    {getMembershipTierDisplay(user?.membershipTier)}
                  </div>
                </div>

                {/* 消費統計卡片 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 mb-5 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-orange-700 font-semibold flex items-center gap-1">
                      💰 累計消費
                    </p>
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    NT$ {user?.totalSpent?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* LINE 連接狀態 */}
              {user?.isLineConnected && (
                <div className="mx-5 mb-5 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#06C755]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    <div>
                      <span className="font-semibold text-sm text-green-700">已綁定 LINE</span>
                      <p className="text-xs text-green-600">{user.lineDisplayName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 快速連結 */}
              <div className="px-5 pb-5 space-y-3">
                <Link
                  href="/account/wallet"
                  className="block w-full px-4 py-3.5 text-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg font-medium transform hover:scale-[1.02]"
                >
                  🎁 購物金 & 優惠券
                </Link>
                <Link
                  href="/orders"
                  className="block w-full px-4 py-3.5 text-center bg-white border-2 border-orange-300 text-orange-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all font-medium"
                >
                  📦 我的訂單
                </Link>
                <Link
                  href="/account/addresses"
                  className="block w-full px-4 py-3.5 text-center bg-white border-2 border-orange-300 text-orange-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all font-medium"
                >
                  📍 收貨地址
                </Link>
                <Link
                  href="/account/referral"
                  className="block w-full px-4 py-3.5 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-medium transform hover:scale-[1.02]"
                >
                  ✨ 邀請好友
                </Link>
              </div>
            </div>
          </div>

          {/* 主內容 */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* 基本資料 */}
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-orange-100">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
                  👤 基本資料
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    ✏️ 編輯
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 mb-2">
                      👤 姓名
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-gray-800 bg-orange-50/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-orange-700 mb-2">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-gray-800 bg-orange-50/30"
                      placeholder="設定您的 Email 以便找回帳號"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-orange-700 mb-2">
                      📱 手機號碼
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-gray-800 bg-orange-50/30"
                      placeholder="0912345678"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                      {updating ? '儲存中...' : '💾 儲存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          name: user?.name || '',
                          email: !isTemporaryEmail(user?.email) ? user?.email || '' : '',
                          phone: user?.phone || '',
                        })
                      }}
                      className="px-6 py-3.5 bg-white border-2 border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-500 transition-all font-semibold"
                    >
                      ❌ 取消
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <label className="block text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      👤 姓名
                    </label>
                    <p className="text-lg font-bold text-gray-800">{user?.name}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <label className="block text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      📧 Email
                    </label>
                    <p className="text-lg font-bold text-gray-800">
                      {!isTemporaryEmail(user?.email) && user?.email ? (
                        user.email
                      ) : (
                        <span className="text-gray-400 text-sm">未設定</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <label className="block text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      📱 手機號碼
                    </label>
                    <p className="text-lg font-bold text-gray-800">
                      {user?.phone || <span className="text-gray-400 text-sm">未設定</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 帳戶安全 */}
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-orange-100">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 sm:mb-8 flex items-center gap-2">
                🔒 帳戶安全
              </h3>

              {user?.isLineConnected ? (
                <div className="space-y-4">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-xl">ℹ️</span>
                      <span>您使用 LINE 登入，無需設定密碼。如需額外的安全保護，可以設定一組備用密碼。</span>
                    </p>
                  </div>

                  <button className="w-full px-6 py-4 bg-white border-2 border-orange-300 rounded-xl hover:bg-orange-50 hover:border-orange-500 transition-all text-left group">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-orange-600 text-lg flex items-center gap-2">
                          🔑 設定備用密碼
                        </span>
                        <p className="text-sm text-gray-600 mt-1">當 LINE 無法使用時，可用密碼登入</p>
                      </div>
                      <span className="text-orange-500 transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button className="w-full px-6 py-4 bg-white border-2 border-orange-300 rounded-xl hover:bg-orange-50 hover:border-orange-500 transition-all text-left group">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-orange-600 text-lg flex items-center gap-2">
                          🔑 變更密碼
                        </span>
                        <p className="text-sm text-gray-600 mt-1">定期更換密碼以保護帳戶安全</p>
                      </div>
                      <span className="text-orange-500 transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </button>

                  <button className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all text-left shadow-lg hover:shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-lg">綁定 LINE</span>
                        <p className="text-sm text-green-100 mt-1">使用 LINE 快速登入</p>
                      </div>
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
