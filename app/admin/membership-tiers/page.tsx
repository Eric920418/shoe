'use client'

/**
 * 會員等級管理頁面（後台）
 * 完全動態配置系統
 */

import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const GET_MEMBERSHIP_TIERS = gql`
  query GetMembershipTiers {
    membershipTiers {
      id
      name
      slug
      minSpent
      maxSpent
      discount
      pointsMultiplier
      freeShippingThreshold
      birthdayGift
      sortOrder
      color
      icon
      description
      isActive
      createdAt
      updatedAt
    }
  }
`

const CREATE_MEMBERSHIP_TIER = gql`
  mutation CreateMembershipTier($input: CreateMembershipTierInput!) {
    createMembershipTier(input: $input) {
      id
      name
      slug
      minSpent
      maxSpent
      discount
      pointsMultiplier
      freeShippingThreshold
      birthdayGift
      sortOrder
      color
      description
      isActive
    }
  }
`

const UPDATE_MEMBERSHIP_TIER = gql`
  mutation UpdateMembershipTier($id: ID!, $input: UpdateMembershipTierInput!) {
    updateMembershipTier(id: $id, input: $input) {
      id
      name
      slug
      minSpent
      maxSpent
      discount
      pointsMultiplier
      freeShippingThreshold
      birthdayGift
      sortOrder
      color
      description
      isActive
    }
  }
`

const DELETE_MEMBERSHIP_TIER = gql`
  mutation DeleteMembershipTier($id: ID!) {
    deleteMembershipTier(id: $id)
  }
`

const RECALCULATE_ALL_TIERS = gql`
  mutation RecalculateAllMembershipTiers {
    recalculateAllMembershipTiers {
      success
      message
      updatedCount
    }
  }
`

interface MembershipTier {
  id: string
  name: string
  slug: string
  minSpent: string
  maxSpent: string | null
  discount: string
  pointsMultiplier: string
  freeShippingThreshold: string
  birthdayGift: string
  sortOrder: number
  color: string | null
  icon: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TierFormData {
  name: string
  slug: string
  minSpent: number
  maxSpent: number | null
  discount: number
  pointsMultiplier: number
  freeShippingThreshold: number
  birthdayGift: number
  sortOrder: number
  color: string
  description: string
}

export default function MembershipTiersPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null)
  const [formData, setFormData] = useState<TierFormData>({
    name: '',
    slug: '',
    minSpent: 0,
    maxSpent: null,
    discount: 0,
    pointsMultiplier: 1.0,
    freeShippingThreshold: 0,
    birthdayGift: 0,
    sortOrder: 0,
    color: '#808080',
    description: '',
  })

  const { data, loading, refetch } = useQuery(GET_MEMBERSHIP_TIERS, {
    fetchPolicy: 'network-only',
  })

  const [createTier, { loading: creating }] = useMutation(CREATE_MEMBERSHIP_TIER, {
    onCompleted: () => {
      toast.success('會員等級創建成功')
      setIsCreating(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(`創建失敗：${error.message}`)
    },
  })

  const [updateTier, { loading: updating }] = useMutation(UPDATE_MEMBERSHIP_TIER, {
    onCompleted: () => {
      toast.success('會員等級更新成功')
      setEditingTier(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [deleteTier] = useMutation(DELETE_MEMBERSHIP_TIER, {
    onCompleted: () => {
      toast.success('會員等級刪除成功')
      refetch()
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  const [recalculateAll, { loading: recalculating }] = useMutation(RECALCULATE_ALL_TIERS, {
    onCompleted: (data) => {
      toast.success(data.recalculateAllMembershipTiers.message)
      refetch()
    },
    onError: (error) => {
      toast.error(`重算失敗：${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      minSpent: 0,
      maxSpent: null,
      discount: 0,
      pointsMultiplier: 1.0,
      freeShippingThreshold: 0,
      birthdayGift: 0,
      sortOrder: 0,
      color: '#808080',
      description: '',
    })
  }

  const handleEdit = (tier: MembershipTier) => {
    setEditingTier(tier)
    setFormData({
      name: tier.name,
      slug: tier.slug,
      minSpent: parseFloat(tier.minSpent),
      maxSpent: tier.maxSpent ? parseFloat(tier.maxSpent) : null,
      discount: parseFloat(tier.discount),
      pointsMultiplier: parseFloat(tier.pointsMultiplier),
      freeShippingThreshold: parseFloat(tier.freeShippingThreshold),
      birthdayGift: parseFloat(tier.birthdayGift),
      sortOrder: tier.sortOrder,
      color: tier.color || '#808080',
      description: tier.description || '',
    })
    setIsCreating(false)

    // 滾動到該等級卡片
    setTimeout(() => {
      const element = document.getElementById(`tier-${tier.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingTier(null)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const input = {
      name: formData.name,
      slug: formData.slug,
      minSpent: formData.minSpent,
      maxSpent: formData.maxSpent,
      discount: formData.discount,
      pointsMultiplier: formData.pointsMultiplier,
      freeShippingThreshold: formData.freeShippingThreshold,
      birthdayGift: formData.birthdayGift,
      sortOrder: formData.sortOrder,
      color: formData.color,
      description: formData.description,
    }

    if (editingTier) {
      updateTier({ variables: { id: editingTier.id, input } })
    } else {
      createTier({ variables: { input } })
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`確定要刪除會員等級「${name}」嗎？\n\n注意：如果有用戶正在使用此等級，將無法刪除。`)) {
      deleteTier({ variables: { id } })
    }
  }

  const handleRecalculateAll = () => {
    if (
      window.confirm(
        '確定要重新計算所有用戶的會員等級嗎？\n\n⚠️ 警告：這將根據當前門檻規則重新計算所有用戶的等級，可能導致部分用戶降級。'
      )
    ) {
      recalculateAll()
    }
  }

  const tiers = data?.membershipTiers || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題與操作按鈕 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">會員等級管理</h1>
            <p className="mt-2 text-gray-600">
              完全動態配置系統 - 可自由調整門檻、優惠與等級數量
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              ➕ 新增會員等級
            </button>
          </div>
        </div>

        {/* 會員等級列表 */}
        <div className="grid gap-6 mb-8">
          {[...tiers]
            .sort((a: MembershipTier, b: MembershipTier) => a.sortOrder - b.sortOrder)
            .map((tier: MembershipTier) => (
              <div key={tier.id} id={`tier-${tier.id}`}>
                {/* 等級卡片 */}
                <div
                  className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {tier.color && (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: tier.color }}
                          />
                        )}
                        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                        <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {tier.slug}
                        </span>
                        <span className="text-xs text-gray-400">順序: {tier.sortOrder}</span>
                        {!tier.isActive && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            已停用
                          </span>
                        )}
                      </div>

                      {tier.description && (
                        <p className="text-gray-600 mb-4">{tier.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 mb-1">消費門檻</div>
                          <div className="font-semibold text-gray-900">
                            ${parseFloat(tier.minSpent).toLocaleString()}
                            {tier.maxSpent && ` - $${parseFloat(tier.maxSpent).toLocaleString()}`}
                            {!tier.maxSpent && ' 以上'}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">會員折扣</div>
                          <div className="font-semibold text-green-600">
                            {(parseFloat(tier.discount) * 100).toFixed(1)}% OFF
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">積分倍數</div>
                          <div className="font-semibold text-blue-600">
                            {parseFloat(tier.pointsMultiplier).toFixed(1)}x
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">免運門檻</div>
                          <div className="font-semibold text-purple-600">
                            {parseFloat(tier.freeShippingThreshold) === 0
                              ? '全免運'
                              : `$${parseFloat(tier.freeShippingThreshold).toLocaleString()}`}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">生日禮</div>
                          <div className="font-semibold text-orange-600">
                            ${parseFloat(tier.birthdayGift).toLocaleString()}
                          </div>
                        </div>

                        <div className="col-span-3">
                          <div className="text-gray-500 mb-1">建立/更新時間</div>
                          <div className="text-xs text-gray-600">
                            建立: {format(new Date(tier.createdAt), 'yyyy-MM-dd HH:mm')} / 更新:{' '}
                            {format(new Date(tier.updatedAt), 'yyyy-MM-dd HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(tier)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id, tier.name)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>

                {/* 編輯表單 - 顯示在該等級下方 */}
                {editingTier?.id === tier.id && (
                  <div className="mt-4 bg-white rounded-lg border-2 border-primary-300 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      編輯會員等級
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            等級名稱 *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="例如：銅卡會員"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            標識符 (slug) *
                          </label>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                            placeholder="例如：bronze"
                            pattern="[a-z0-9_-]+"
                            title="只能使用小寫字母、數字、底線和連字號"
                            required
                            disabled={!!editingTier}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            最低消費門檻 ($) *
                          </label>
                          <input
                            type="number"
                            value={formData.minSpent}
                            onChange={(e) =>
                              setFormData({ ...formData, minSpent: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            最高消費門檻 ($)
                          </label>
                          <input
                            type="number"
                            value={formData.maxSpent || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maxSpent: e.target.value ? parseFloat(e.target.value) : null,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                            placeholder="最高等級留空"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            折扣率 (0-1) *
                          </label>
                          <input
                            type="number"
                            value={formData.discount}
                            onChange={(e) =>
                              setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            max="1"
                            step="0.01"
                            placeholder="0.05 = 5% 折扣"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {(formData.discount * 100).toFixed(1)}% OFF
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            積分倍數 *
                          </label>
                          <input
                            type="number"
                            value={formData.pointsMultiplier}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pointsMultiplier: parseFloat(e.target.value) || 1,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            step="0.1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            免運門檻 ($) *
                          </label>
                          <input
                            type="number"
                            value={formData.freeShippingThreshold}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                freeShippingThreshold: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                            placeholder="0 = 全免運"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            生日禮購物金 ($) *
                          </label>
                          <input
                            type="number"
                            value={formData.birthdayGift}
                            onChange={(e) =>
                              setFormData({ ...formData, birthdayGift: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            排序順序 *
                          </label>
                          <input
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) =>
                              setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">數字越小等級越低</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            顯示顏色
                          </label>
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={2}
                          placeholder="會員等級的說明文字"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={creating || updating}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {creating || updating ? '處理中...' : '更新等級'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreating(false)
                            setEditingTier(null)
                            resetForm()
                          }}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* 新增表單 */}
        {isCreating && (
          <div className="bg-white rounded-lg border-2 border-primary-300 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              新增會員等級
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    等級名稱 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="例如：銅卡會員"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    標識符 (slug) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder="例如：bronze"
                    pattern="[a-z0-9_-]+"
                    title="只能使用小寫字母、數字、底線和連字號"
                    required
                    disabled={!!editingTier}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低消費門檻 ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.minSpent}
                    onChange={(e) =>
                      setFormData({ ...formData, minSpent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最高消費門檻 ($)
                  </label>
                  <input
                    type="number"
                    value={formData.maxSpent || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxSpent: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    placeholder="最高等級留空"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣率 (0-1) *
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    max="1"
                    step="0.01"
                    placeholder="0.05 = 5% 折扣"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.discount * 100).toFixed(1)}% OFF
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    積分倍數 *
                  </label>
                  <input
                    type="number"
                    value={formData.pointsMultiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsMultiplier: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    免運門檻 ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.freeShippingThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeShippingThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    placeholder="0 = 全免運"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生日禮購物金 ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.birthdayGift}
                    onChange={(e) =>
                      setFormData({ ...formData, birthdayGift: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序順序 *
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">數字越小等級越低</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顯示顏色
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="會員等級的說明文字"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {creating ? '處理中...' : '創建等級'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingTier(null)
                    resetForm()
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
