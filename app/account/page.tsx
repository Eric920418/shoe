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
import AccountHeader from '@/components/navigation/AccountHeader'
import { Copy, Check, Gift, ChevronRight } from 'lucide-react'

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

const GET_MY_REFERRAL_CODE = gql`
  query GetMyReferralCode {
    myReferralCode {
      code
      referrerReward
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
  const [copySuccess, setCopySuccess] = useState(false)
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

  const { data: referralData } = useQuery(GET_MY_REFERRAL_CODE, {
    skip: !authUser,
  })

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      // 檢查是否首次綁定信箱
      const wasTemporaryEmail = isTemporaryEmail(user?.email)
      const isNowRealEmail = !isTemporaryEmail(data.updateProfile.email)
      const isFirstTimeBinding = wasTemporaryEmail && isNowRealEmail && formData.email && formData.email.trim() !== ''

      updateUser(data.updateProfile)
      setIsEditing(false)

      if (isFirstTimeBinding) {
        alert('🎉 資料已更新！您已獲得 NT$100 優惠券，可至「購物金 & 優惠券」頁面查看！')
      } else {
        alert('資料已更新')
      }

      // 重新載入資料以更新 UI
      refetch()
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

  // 生成邀請連結
  const referralCode = referralData?.myReferralCode
  const referralUrl = typeof window !== 'undefined' && referralCode?.code
    ? `${window.location.origin}?ref=${referralCode.code}`
    : ''

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('複製失敗，請手動複製')
    }
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
    <>
      <AccountHeader />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* 綁定信箱獎勵提示 */}
            {isTemporaryEmail(user?.email) && (
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl shadow-lg p-6 border-2 border-orange-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">🎁</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      綁定信箱即送 NT$100 優惠券！
                    </h3>
                    <p className="text-white/90 text-sm mb-3">
                      立即綁定您的 Email，即可獲得一張 100 元優惠券（滿 500
                      元可使用）
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                        ✓ 立即發放
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                        ✓ 無使用期限
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                        ✓ 全站通用
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-shrink-0 px-6 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    立即綁定
                  </button>
                </div>
              </div>
            )}

            {/* 分享邀請連結賺購物金 */}
            {referralCode && (
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-emerald-300">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 hidden sm:block">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Gift className="w-5 h-5 sm:hidden" />
                      分享連結賺購物金
                    </h3>
                    <p className="text-white/90 text-sm mb-4">
                      分享你的專屬連結給好友，好友完成訂單後，你將獲得
                      <span className="font-bold text-yellow-200"> NT${referralCode.referrerReward} </span>
                      購物金！無上限、永不過期
                    </p>

                    {/* 邀請連結複製區 */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0 px-3 py-2 bg-white/20 rounded-lg overflow-hidden">
                          <p className="text-white/80 text-xs mb-1">你的專屬連結</p>
                          <p className="text-white font-mono text-xs sm:text-sm truncate">
                            {referralUrl}
                          </p>
                        </div>
                        <button
                          onClick={handleCopyReferral}
                          className={`w-full sm:w-auto flex-shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                            copySuccess
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {copySuccess ? (
                            <>
                              <Check className="w-5 h-5" />
                              <span>已複製</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-5 h-5" />
                              <span>複製連結</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 查看詳情連結 */}
                    <Link
                      href="/account/referral"
                      className="inline-flex items-center gap-1 mt-3 text-white/80 hover:text-white text-sm font-medium transition-colors"
                    >
                      查看邀請記錄與詳情
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 基本資料 */}
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-orange-100">
              {/* 頂部區域：頭像 + 姓名 + 編輯按鈕 */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* 頭像 */}
                  <div className="flex-shrink-0">
                    {user?.lineProfileImage ? (
                      <img
                        src={user.lineProfileImage}
                        alt={user.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-100 shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg border-4 border-orange-100">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  {/* 姓名和會員等級 */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                      {user?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tierStyles.icon}</span>
                      <span className={`text-sm font-bold ${tierStyles.gradient ? `bg-gradient-to-r ${tierStyles.gradient} bg-clip-text text-transparent` : 'text-gray-700'}`}>
                        {getMembershipTierDisplay(user?.membershipTier)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 編輯按鈕 */}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium shadow-md hover:shadow-lg text-sm sm:text-base flex-shrink-0"
                  >
                    ✏️ 編輯
                  </button>
                )}
              </div>

              {/* 消費統計和 LINE 連接狀態 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* 消費統計卡片 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200">
                  <p className="text-sm text-orange-700 font-semibold mb-2 flex items-center gap-2">
                    💰 累計消費
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    NT$ {user?.totalSpent?.toLocaleString() || "0"}
                  </p>
                </div>

                {/* LINE 連接狀態 */}
                {user?.isLineConnected && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8 text-[#06C755] flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      <div>
                        <p className="font-semibold text-sm text-green-700">
                          已綁定 LINE
                        </p>
                        <p className="text-xs text-green-600">
                          {user.lineDisplayName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 分隔線 */}
              <div className="border-t border-orange-100 mb-6"></div>

              {/* 基本資料表單/顯示 */}
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 mb-2">
                      👤 姓名
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
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
                      {updating ? "儲存中..." : "💾 儲存"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          name: user?.name || '',
                          email: !isTemporaryEmail(user?.email)
                            ? user?.email || ''
                            : '',
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
                    <p className="text-lg font-bold text-gray-800">
                      {user?.name}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <label className="block text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      📧 Email
                    </label>
                    <p className="text-lg font-bold text-gray-800 break-all">
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
                      {user?.phone || (
                        <span className="text-gray-400 text-sm">未設定</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
