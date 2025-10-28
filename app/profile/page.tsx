'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GET_ME, UPDATE_PROFILE } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthday: '',
    gender: '',
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('請先登入')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, refetch } = useQuery(GET_ME, {
    skip: !isAuthenticated,
    onCompleted: (data) => {
      if (data?.me) {
        setFormData({
          name: data.me.name || '',
          phone: data.me.phone || '',
          birthday: data.me.birthday || '',
          gender: data.me.gender || '',
        })
      }
    },
  })

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => {
      alert('更新成功！')
      setIsEditing(false)
      refetch()
    },
    onError: (error) => {
      alert(error.message || '更新失敗')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile({
      variables: {
        input: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          birthday: formData.birthday || null,
          gender: formData.gender || null,
        },
      },
    })
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
        </div>
      </div>
    )
  }

  const user = data?.me

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">個人中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <nav className="space-y-2">
              <Link
                href="/profile"
                className="block px-4 py-2 bg-primary-50 text-primary-600 rounded-lg font-medium"
              >
                個人資料
              </Link>
              <Link
                href="/profile/addresses"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                地址管理
              </Link>
              <Link
                href="/orders"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                我的訂單
              </Link>
              <Link
                href="/profile/reviews"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                我的評論
              </Link>
              <Link
                href="/profile/coupons"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                我的優惠券
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                登出
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">基本資料</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  編輯
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    手機號碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">生日</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">請選擇</option>
                    <option value="MALE">男性</option>
                    <option value="FEMALE">女性</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {updating ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* 會員等級卡片 */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <label className="text-sm text-primary-700 font-medium">會員等級</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                            user.membershipTier === 'DIAMOND'
                              ? 'bg-purple-100 text-purple-700'
                              : user.membershipTier === 'PLATINUM'
                              ? 'bg-gray-300 text-gray-800'
                              : user.membershipTier === 'GOLD'
                              ? 'bg-yellow-100 text-yellow-700'
                              : user.membershipTier === 'SILVER'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {user.membershipTier === 'DIAMOND'
                            ? '💎 鑽石卡會員'
                            : user.membershipTier === 'PLATINUM'
                            ? '⚪ 白金卡會員'
                            : user.membershipTier === 'GOLD'
                            ? '🥇 金卡會員'
                            : user.membershipTier === 'SILVER'
                            ? '🥈 銀卡會員'
                            : '🥉 銅卡會員'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <label className="text-sm text-primary-700 font-medium">累計消費</label>
                      <p className="text-2xl font-bold text-primary-900">
                        ${user.totalSpent?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {/* 升級進度條 */}
                  {user.membershipTier !== 'DIAMOND' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-primary-700 mb-2">
                        <span>距離下一等級</span>
                        <span>
                          還需消費 $
                          {(() => {
                            const tiers = {
                              BRONZE: 1000,
                              SILVER: 5000,
                              GOLD: 20000,
                              PLATINUM: 50000,
                            }
                            const currentSpent = user.totalSpent || 0
                            const nextThreshold =
                              tiers[user.membershipTier as keyof typeof tiers] || 0
                            return (nextThreshold - currentSpent).toLocaleString()
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-primary-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(() => {
                              const tiers = {
                                BRONZE: { min: 0, max: 1000 },
                                SILVER: { min: 1000, max: 5000 },
                                GOLD: { min: 5000, max: 20000 },
                                PLATINUM: { min: 20000, max: 50000 },
                              }
                              const currentSpent = user.totalSpent || 0
                              const tierRange =
                                tiers[user.membershipTier as keyof typeof tiers]
                              if (!tierRange) return 0
                              const progress =
                                ((currentSpent - tierRange.min) /
                                  (tierRange.max - tierRange.min)) *
                                100
                              return Math.min(Math.max(progress, 0), 100)
                            })()}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 基本資料 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">姓名</label>
                    <p className="text-gray-900 font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">手機號碼</label>
                    <p className="text-gray-900 font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">會員積分</label>
                    <p className="text-gray-900 font-medium text-lg">
                      ✨ {user.membershipPoints?.toLocaleString() || 0} 點
                    </p>
                    <p className="text-xs text-gray-500 mt-1">積分僅供記錄展示</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">訂單總數</label>
                    <p className="text-gray-900 font-medium">{user.totalOrders || 0} 筆</p>
                  </div>
                </div>

                {/* 會員權益說明 */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">會員專屬權益</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {user.membershipTier === 'DIAMOND' && (
                      <>
                        <p>✓ 購物享 15% 折扣</p>
                        <p>✓ 購物積分 3 倍加成</p>
                        <p>✓ 全館免運費</p>
                        <p>✓ 生日禮：$500 折價券</p>
                      </>
                    )}
                    {user.membershipTier === 'PLATINUM' && (
                      <>
                        <p>✓ 購物享 10% 折扣</p>
                        <p>✓ 購物積分 2 倍加成</p>
                        <p>✓ 全館免運費</p>
                        <p>✓ 生日禮：$200 折價券</p>
                      </>
                    )}
                    {user.membershipTier === 'GOLD' && (
                      <>
                        <p>✓ 購物享 8% 折扣</p>
                        <p>✓ 購物積分 1.5 倍加成</p>
                        <p>✓ 滿 $500 免運費</p>
                        <p>✓ 生日禮：$100 折價券</p>
                      </>
                    )}
                    {user.membershipTier === 'SILVER' && (
                      <>
                        <p>✓ 購物享 5% 折扣</p>
                        <p>✓ 購物積分 1.2 倍加成</p>
                        <p>✓ 滿 $800 免運費</p>
                        <p>✓ 生日禮：$50 折價券</p>
                      </>
                    )}
                    {user.membershipTier === 'BRONZE' && (
                      <>
                        <p>✓ 標準購物積分</p>
                        <p>✓ 滿 $1000 免運費</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
