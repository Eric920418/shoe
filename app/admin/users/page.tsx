'use client'

import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

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
  const limit = 20

  const { data: tiersData } = useQuery(GET_MEMBERSHIP_TIERS, {
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

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">用戶管理</h1>
        <p className="mt-2 text-gray-600">管理所有用戶、會員等級、積分與權限</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋</label>
            <input
              type="text"
              placeholder="搜尋姓名、Email、電話..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="USER">用戶</option>
              <option value="ADMIN">管理員</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">會員等級</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {availableTiers.map((tier: any) => (
                <option key={tier.id} value={tier.id}>
                  {tier.icon ? `${tier.icon} ` : ''}{tier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">狀態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
      </div>

      {/* 用戶列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用戶資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    會員等級
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    積分
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
                  <tr key={user.id} className="hover:bg-gray-50">
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
                      <span className="text-sm font-medium text-gray-900">{user.membershipPoints}</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">會員積分</label>
                <input
                  type="number"
                  value={formData?.membershipPoints ?? editingUser.membershipPoints}
                  onChange={(e) => setFormData({ ...formData, membershipPoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
    </div>
  )
}
