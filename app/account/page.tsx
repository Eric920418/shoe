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

  return (
    <div className="h-[calc(100vh-4rem)] bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 側邊欄 */}
          <div className="lg:col-span-1">
            <div className="border-2 border-black bg-white p-6">
              {/* 頭像 */}
              <div>
                {user?.lineProfileImage ? (
                  <img
                    src={user.lineProfileImage}
                    alt={user.name}
                    className="w-24 h-24 mx-auto border-2 border-black object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto bg-black flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <h2 className="mt-6 text-2xl font-bold text-black">{user?.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {!isTemporaryEmail(user?.email) && user?.email
                    ? user.email
                    : user?.phone || '會員'}
                </p>

                {/* 會員等級 */}
                <div className="mt-4 inline-block bg-black text-white px-4 py-2 text-xs uppercase tracking-wider font-bold">
                  {getMembershipTierDisplay(user?.membershipTier)}
                </div>

                {/* 消費統計 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">累計消費</p>
                  <p className="text-xl font-bold text-black">
                    NT$ {user?.totalSpent?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* LINE 連接狀態 */}
              {user?.isLineConnected && (
                <div className="mt-6 p-4 border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-black">
                    <svg className="w-5 h-5 text-[#06C755]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    <span className="font-medium text-sm">已綁定 LINE</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{user.lineDisplayName}</p>
                </div>
              )}

              {/* 快速連結 */}
              <div className="mt-6 space-y-2">
                <Link
                  href="/account/wallet"
                  className="block w-full px-4 py-3 text-center bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                >
                  購物金 & 優惠券
                </Link>
                <Link
                  href="/orders"
                  className="block w-full px-4 py-3 text-center border border-gray-300 hover:border-black transition-colors font-medium"
                >
                  我的訂單
                </Link>
                <Link
                  href="/account/addresses"
                  className="block w-full px-4 py-3 text-center border border-gray-300 hover:border-black transition-colors font-medium"
                >
                  收貨地址
                </Link>
                <Link
                  href="/account/referral"
                  className="block w-full px-4 py-3 text-center border border-gray-300 hover:border-black transition-colors font-medium"
                >
                  邀請好友
                </Link>
              </div>
            </div>
          </div>

          {/* 主內容 */}
          <div className="lg:col-span-3 space-y-8">
            {/* 基本資料 */}
            <div className="border-2 border-black bg-white p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-black uppercase tracking-tight">基本資料</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                  >
                    編輯
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      姓名
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                      placeholder="設定您的 Email 以便找回帳號"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      手機號碼
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                      placeholder="0912345678"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
                    >
                      {updating ? '儲存中...' : '儲存'}
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
                      className="px-6 py-3 border-2 border-black hover:bg-gray-50 transition-colors font-medium"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">姓名</label>
                    <p className="text-lg font-medium text-black">{user?.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Email</label>
                    <p className="text-lg font-medium text-black">
                      {!isTemporaryEmail(user?.email) && user?.email ? (
                        user.email
                      ) : (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">手機號碼</label>
                    <p className="text-lg font-medium text-black">
                      {user?.phone || <span className="text-gray-400">未設定</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 帳戶安全 */}
            <div className="border-2 border-black bg-white p-8">
              <h3 className="text-2xl font-bold text-black uppercase tracking-tight mb-8">帳戶安全</h3>

              {user?.isLineConnected ? (
                <div className="space-y-4">
                  <div className="p-6 border border-gray-200 bg-gray-50">
                    <p className="text-sm text-black">
                      您使用 LINE 登入，無需設定密碼。如需額外的安全保護，可以設定一組備用密碼。
                    </p>
                  </div>

                  <button className="w-full px-6 py-4 border-2 border-black hover:bg-gray-50 transition-colors text-left">
                    <span className="font-bold text-black">設定備用密碼</span>
                    <p className="text-sm text-gray-600 mt-1">當 LINE 無法使用時，可用密碼登入</p>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button className="w-full px-6 py-4 border-2 border-black hover:bg-gray-50 transition-colors text-left">
                    <span className="font-bold text-black">變更密碼</span>
                    <p className="text-sm text-gray-600 mt-1">定期更換密碼以保護帳戶安全</p>
                  </button>

                  <button className="w-full px-6 py-4 bg-black text-white hover:bg-gray-800 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">綁定 LINE</span>
                        <p className="text-sm text-gray-300 mt-1">使用 LINE 快速登入</p>
                      </div>
                      <svg className="w-8 h-8 text-[#06C755]" fill="currentColor" viewBox="0 0 24 24">
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
