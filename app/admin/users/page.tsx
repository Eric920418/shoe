'use client'

import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const GET_COUPONS_FOR_GRANT = gql`
  query GetCouponsForGrant {
    coupons(isActive: true, limit: 100) {
      coupons {
        id
        code
        name
        type
        value
        maxDiscount
        usageLimit
        usedCount
      }
    }
  }
`

const GRANT_COUPON_TO_USER = gql`
  mutation GrantCouponToUser($userId: ID!, $couponId: ID!) {
    grantCouponToUser(userId: $userId, couponId: $couponId) {
      id
      coupon {
        code
        name
      }
      user {
        name
      }
    }
  }
`

const BATCH_GRANT_COUPON = gql`
  mutation BatchGrantCoupon($userIds: [ID!]!, $couponId: ID!) {
    batchGrantCoupon(userIds: $userIds, couponId: $couponId) {
      success
      successCount
      skipCount
      message
    }
  }
`

const GET_USERS = gql`
  query GetUsers(
    $search: String
    $role: Role
    $membershipTierId: ID
    $isActive: Boolean
    $page: Int
    $limit: Int
  ) {
    users(
      search: $search
      role: $role
      membershipTierId: $membershipTierId
      isActive: $isActive
      page: $page
      limit: $limit
    ) {
      users {
        id
        email
        name
        phone
        role
        membershipTierConfig {
          id
          name
          slug
          color
        }
        membershipPoints
        totalOrders
        totalSpent
        isActive
        createdAt
        lastLogin
      }
      total
      page
      limit
      totalPages
    }
  }
`

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      name
      phone
      role
      membershipTierConfig {
        id
        name
        slug
        color
      }
      membershipPoints
      isActive
    }
  }
`

const GET_MEMBERSHIP_TIERS = gql`
  query GetMembershipTiers {
    membershipTiers {
      id
      name
      slug
      color
    }
  }
`

const roleLabels: Record<string, { label: string; color: string }> = {
  USER: { label: '用戶', color: 'bg-green-100 text-green-800' },
  ADMIN: { label: '管理員', color: 'bg-red-100 text-red-800' },
}

export default function UsersManagementPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponTargetUser, setCouponTargetUser] = useState<any>(null)
  const [selectedCouponId, setSelectedCouponId] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBatchModal, setShowBatchModal] = useState(false)
  const limit = 20

  const { data: tiersData } = useQuery(GET_MEMBERSHIP_TIERS, {
    fetchPolicy: 'cache-first',
  })

  const { data: couponsData } = useQuery(GET_COUPONS_FOR_GRANT, {
    fetchPolicy: 'cache-first',
  })

  const { data, loading, refetch } = useQuery(GET_USERS, {
    variables: {
      search: search || undefined,
      role: roleFilter || undefined,
      membershipTierId: tierFilter || undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'active',
      page,
      limit,
    },
    fetchPolicy: 'network-only',
  })

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      toast.success('用戶資訊更新成功')
      setEditingUser(null)
      setFormData(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [grantCoupon, { loading: granting }] = useMutation(GRANT_COUPON_TO_USER, {
    onCompleted: (data) => {
      toast.success(`已發放優惠券 ${data.grantCouponToUser.coupon.code} 給 ${data.grantCouponToUser.user.name}`)
      setShowCouponModal(false)
      setCouponTargetUser(null)
      setSelectedCouponId('')
    },
    onError: (error) => {
      toast.error(`發放失敗：${error.message}`)
    },
  })

  const [batchGrantCoupon, { loading: batchGranting }] = useMutation(BATCH_GRANT_COUPON, {
    onCompleted: (data) => {
      toast.success(data.batchGrantCoupon.message)
      setShowBatchModal(false)
      setSelectedUsers(new Set())
      setSelectedCouponId('')
    },
    onError: (error) => {
      toast.error(`批量發放失敗：${error.message}`)
    },
  })

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await updateUser({
        variables: {
          id: userId,
          input: updates,
        },
      })
    } catch (error) {
      console.error('Update user failed:', error)
    }
  }

  const users = data?.users?.users || []
  const total = data?.users?.total || 0
  const totalPages = data?.users?.totalPages || 1
  const availableTiers = tiersData?.membershipTiers || []
  const availableCoupons = couponsData?.coupons?.coupons || []

  // 切換用戶選擇
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map((u: any) => u.id)))
    }
  }

  // 發放優惠券給單個用戶
  const handleGrantCoupon = async () => {
    if (!couponTargetUser || !selectedCouponId) return
    await grantCoupon({
      variables: {
        userId: couponTargetUser.id,
        couponId: selectedCouponId,
      },
    })
  }

  // 批量發放優惠券
  const handleBatchGrantCoupon = async () => {
    if (selectedUsers.size === 0 || !selectedCouponId) return
    await batchGrantCoupon({
      variables: {
        userIds: Array.from(selectedUsers),
        couponId: selectedCouponId,
      },
    })
  }

  return (
    <div className="space-y-4 lg:space-y-6 -mx-4 px-4 lg:mx-0 lg:px-0">
      {/* 頁面標題 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">用戶管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            共 <span className="font-semibold">{total}</span> 位用戶
          </p>
        </div>
        {selectedUsers.size > 0 && (
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            發放優惠券給 {selectedUsers.size} 人
          </button>
        )}
      </div>

      {/* 手機版統計摘要 */}
      <div className="lg:hidden grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-600 mt-1">總用戶</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-xl font-bold text-green-600">
            {users.filter((u: any) => u.isActive).length}
          </p>
          <p className="text-xs text-gray-600 mt-1">活躍用戶</p>
        </div>
      </div>

      {/* 統計卡片 - 桌面版 */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總用戶數</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        {availableTiers.slice(0, 3).map((tier: any) => {
          const count = users.filter((u: any) => u.membershipTierConfig?.id === tier.id).length
          return (
            <div key={tier.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{tier.name}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: tier.color || '#6B7280' }}>
                    {count}
                  </p>
                </div>
                <div className="text-3xl">{tier.icon || '⭐'}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 篩選區域 */}
      <div className="bg-white p-3 lg:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2 mb-3 lg:mb-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜尋姓名、Email、電話..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-3 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1"
          >
            <span className="text-sm">篩選</span>
            {(roleFilter || tierFilter || statusFilter) && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {(roleFilter ? 1 : 0) + (tierFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* 篩選選項 */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200">
            <div className="hidden lg:block"></div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">全部角色</option>
              <option value="USER">用戶</option>
              <option value="ADMIN">管理員</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">全部等級</option>
              {availableTiers.map((tier: any) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">全部狀態</option>
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
      </div>

      {/* 手機版用戶卡片列表 */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">沒有找到符合條件的用戶</p>
          </div>
        ) : (
          users.map((user: any) => (
            <div
              key={user.id}
              className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                selectedUsers.has(user.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="p-4">
                {/* 用戶資訊 + 選擇框 */}
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                          roleLabels[user.role]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {roleLabels[user.role]?.label || user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
                  </div>
                  <button
                    onClick={() =>
                      handleUpdateUser(user.id, {
                        isActive: !user.isActive,
                      })
                    }
                    className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? '啟用' : '停用'}
                  </button>
                </div>

                {/* 用戶數據 */}
                <div className="flex items-center gap-4 text-sm ml-7">
                  {user.membershipTierConfig && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: user.membershipTierConfig.color ? `${user.membershipTierConfig.color}20` : '#F3F4F6',
                        color: user.membershipTierConfig.color || '#1F2937'
                      }}
                    >
                      {user.membershipTierConfig.name}
                    </span>
                  )}
                  <span className="text-gray-600">
                    {user.totalOrders} 筆訂單
                  </span>
                  <span className="text-gray-900 font-medium">
                    ${parseFloat(user.totalSpent).toFixed(0)}
                  </span>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setCouponTargetUser(user)
                      setShowCouponModal(true)
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium text-center"
                  >
                    發券
                  </button>
                  <button
                    onClick={() => {
                      setEditingUser(user)
                      setFormData({
                        membershipTierId: user.membershipTierConfig?.id,
                        membershipPoints: user.membershipPoints,
                        role: user.role,
                      })
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center"
                  >
                    編輯
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* 手機版分頁 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        )}
      </div>

      {/* 桌面版用戶列表 */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">沒有找到符合條件的用戶</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUsers.size === users.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用戶資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    會員等級
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    回饋倍數
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單 / 消費
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: any) => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.has(user.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        <span className="text-sm text-gray-500">{user.email}</span>
                        {user.phone && <span className="text-xs text-gray-400">{user.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.membershipTierConfig ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: user.membershipTierConfig.color ? `${user.membershipTierConfig.color}20` : '#F3F4F6',
                            color: user.membershipTierConfig.color || '#1F2937'
                          }}
                        >
                          {user.membershipTierConfig.icon && `${user.membershipTierConfig.icon} `}
                          {user.membershipTierConfig.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {user.membershipTierConfig?.pointsMultiplier
                          ? `${parseFloat(user.membershipTierConfig.pointsMultiplier).toFixed(1)}x`
                          : '1.0x'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{user.totalOrders} 筆</span>
                        <span className="text-sm text-gray-500">${parseFloat(user.totalSpent).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          roleLabels[user.role]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {roleLabels[user.role]?.label || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleUpdateUser(user.id, {
                            isActive: !user.isActive,
                          })
                        }
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? '✓ 啟用' : '✗ 停用'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCouponTargetUser(user)
                            setShowCouponModal(true)
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          發券
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(user)
                            setFormData({
                              membershipTierId: user.membershipTierConfig?.id,
                              membershipPoints: user.membershipPoints,
                              role: user.role,
                            })
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          編輯
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              顯示 {(page - 1) * limit + 1} - {Math.min(page * limit, total)} / 共 {total} 筆
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一頁
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                第 {page} / {totalPages} 頁
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 編輯用戶彈窗 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">編輯用戶：{editingUser.name}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">會員等級</label>
                <select
                  value={formData?.membershipTierId || editingUser.membershipTierConfig?.id || ''}
                  onChange={(e) => setFormData({ ...formData, membershipTierId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">請選擇</option>
                  {availableTiers.map((tier: any) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.icon ? `${tier.icon} ` : ''}{tier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 積分欄位已棄用，改用購物金系統 */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                <select
                  value={formData?.role || editingUser.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">用戶</option>
                  <option value="ADMIN">管理員</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setEditingUser(null)
                  setFormData(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() =>
                  handleUpdateUser(editingUser.id, formData || {
                    membershipTierId: editingUser.membershipTierConfig?.id,
                    membershipPoints: editingUser.membershipPoints,
                    role: editingUser.role,
                  })
                }
                disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 發放優惠券給單個用戶彈窗 */}
      {showCouponModal && couponTargetUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              發放優惠券給 {couponTargetUser.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇優惠券</label>
                <select
                  value={selectedCouponId}
                  onChange={(e) => setSelectedCouponId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">請選擇優惠券</option>
                  {availableCoupons.map((coupon: any) => (
                    <option key={coupon.id} value={coupon.id}>
                      {coupon.code} - {coupon.name} ({coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : coupon.type === 'FIXED' ? `$${coupon.value}` : '免運費'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCouponId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  {(() => {
                    const coupon = availableCoupons.find((c: any) => c.id === selectedCouponId)
                    if (!coupon) return null
                    return (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{coupon.name}</p>
                        <p className="text-gray-600 mt-1">
                          代碼：<span className="font-mono">{coupon.code}</span>
                        </p>
                        <p className="text-gray-600">
                          折扣：{coupon.type === 'PERCENTAGE' ? `${coupon.value}%${coupon.maxDiscount ? `（上限 $${coupon.maxDiscount}）` : ''}` : coupon.type === 'FIXED' ? `$${coupon.value}` : '免運費'}
                        </p>
                        {coupon.usageLimit && (
                          <p className="text-gray-500 text-xs mt-1">
                            使用次數：{coupon.usedCount} / {coupon.usageLimit}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCouponModal(false)
                  setCouponTargetUser(null)
                  setSelectedCouponId('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleGrantCoupon}
                disabled={granting || !selectedCouponId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {granting ? '發放中...' : '發放'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量發放優惠券彈窗 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              批量發放優惠券
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  已選擇 <span className="font-bold">{selectedUsers.size}</span> 位用戶
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇優惠券</label>
                <select
                  value={selectedCouponId}
                  onChange={(e) => setSelectedCouponId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">請選擇優惠券</option>
                  {availableCoupons.map((coupon: any) => (
                    <option key={coupon.id} value={coupon.id}>
                      {coupon.code} - {coupon.name} ({coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : coupon.type === 'FIXED' ? `$${coupon.value}` : '免運費'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCouponId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  {(() => {
                    const coupon = availableCoupons.find((c: any) => c.id === selectedCouponId)
                    if (!coupon) return null
                    return (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{coupon.name}</p>
                        <p className="text-gray-600 mt-1">
                          代碼：<span className="font-mono">{coupon.code}</span>
                        </p>
                        <p className="text-gray-600">
                          折扣：{coupon.type === 'PERCENTAGE' ? `${coupon.value}%${coupon.maxDiscount ? `（上限 $${coupon.maxDiscount}）` : ''}` : coupon.type === 'FIXED' ? `$${coupon.value}` : '免運費'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowBatchModal(false)
                  setSelectedCouponId('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchGrantCoupon}
                disabled={batchGranting || !selectedCouponId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {batchGranting ? '發放中...' : `發放給 ${selectedUsers.size} 人`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
