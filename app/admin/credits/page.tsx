'use client'

import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const GET_CREDITS = gql`
  query GetCredits($userId: String, $source: CreditSource, $isActive: Boolean, $page: Int, $limit: Int) {
    credits(userId: $userId, source: $source, isActive: $isActive, page: $page, limit: $limit) {
      credits {
        id
        userId
        user {
          id
          name
          email
          phone
        }
        amount
        balance
        source
        sourceId
        maxUsagePerOrder
        minOrderAmount
        validFrom
        validUntil
        isActive
        isUsed
        createdAt
        updatedAt
      }
      total
      page
      limit
      totalPages
    }
  }
`

const GRANT_CREDIT = gql`
  mutation GrantCredit($input: GrantCreditInput!) {
    grantCredit(input: $input) {
      id
      userId
      amount
      balance
    }
  }
`

const BATCH_GRANT_CREDIT = gql`
  mutation BatchGrantCredit($input: BatchGrantCreditInput!) {
    batchGrantCredit(input: $input) {
      count
    }
  }
`

const UPDATE_CREDIT = gql`
  mutation UpdateCredit($id: ID!, $input: UpdateCreditInput!) {
    updateCredit(id: $id, input: $input) {
      id
      balance
      isActive
    }
  }
`

const DELETE_CREDIT = gql`
  mutation DeleteCredit($id: ID!) {
    deleteCredit(id: $id)
  }
`

const GET_USERS = gql`
  query GetUsers($search: String, $page: Int, $limit: Int) {
    users(search: $search, page: $page, limit: $limit) {
      users {
        id
        name
        email
        phone
      }
    }
  }
`

const sourceLabels: Record<string, { label: string; color: string; icon: string }> = {
  CAMPAIGN: { label: '活動獎勵', color: 'bg-purple-100 text-purple-800', icon: '🎁' },
  REFUND: { label: '退款', color: 'bg-blue-100 text-blue-800', icon: '↩️' },
  ADMIN_GRANT: { label: '管理員發放', color: 'bg-green-100 text-green-800', icon: '👑' },
  BIRTHDAY: { label: '生日禮金', color: 'bg-pink-100 text-pink-800', icon: '🎂' },
  REVIEW: { label: '評論獎勵', color: 'bg-yellow-100 text-yellow-800', icon: '⭐' },
}

export default function CreditsManagementPage() {
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [editingCredit, setEditingCredit] = useState<any>(null)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const limit = 20

  const { data, loading, refetch } = useQuery(GET_CREDITS, {
    variables: {
      source: sourceFilter || undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'active',
      page,
      limit,
    },
    fetchPolicy: 'network-only',
  })

  const { data: usersData } = useQuery(GET_USERS, {
    variables: {
      search: userSearch || undefined,
      page: 1,
      limit: 10,
    },
    skip: !userSearch,
  })

  const [grantCredit, { loading: granting }] = useMutation(GRANT_CREDIT, {
    onCompleted: () => {
      toast.success('購物金發放成功')
      setShowGrantModal(false)
      setSelectedUser(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`發放失敗：${error.message}`)
    },
  })

  const [batchGrantCredit, { loading: batchGranting }] = useMutation(BATCH_GRANT_CREDIT, {
    onCompleted: (data) => {
      toast.success(`成功發放給 ${data.batchGrantCredit.count} 位用戶`)
      setShowBatchModal(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`批量發放失敗：${error.message}`)
    },
  })

  const [updateCredit, { loading: updating }] = useMutation(UPDATE_CREDIT, {
    onCompleted: () => {
      toast.success('購物金更新成功')
      setEditingCredit(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [deleteCredit] = useMutation(DELETE_CREDIT, {
    onCompleted: () => {
      toast.success('購物金已停用')
      refetch()
    },
    onError: (error) => {
      toast.error(`停用失敗：${error.message}`)
    },
  })

  const handleGrantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedUser) {
      toast.error('請選擇用戶')
      return
    }

    const input = {
      userId: selectedUser.id,
      amount: parseFloat(formData.get('amount') as string),
      source: formData.get('source') as string || 'ADMIN_GRANT',
      maxUsagePerOrder: formData.get('maxUsagePerOrder')
        ? parseFloat(formData.get('maxUsagePerOrder') as string)
        : undefined,
      minOrderAmount: formData.get('minOrderAmount')
        ? parseFloat(formData.get('minOrderAmount') as string)
        : undefined,
      validFrom: formData.get('validFrom') ? new Date(formData.get('validFrom') as string).toISOString() : undefined,
      validUntil: new Date(formData.get('validUntil') as string).toISOString(),
      isActive: true,
    }

    await grantCredit({ variables: { input } })
  }

  const handleBatchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const input: any = {
      amount: parseFloat(formData.get('amount') as string),
      source: formData.get('source') as string || 'ADMIN_GRANT',
      validUntil: new Date(formData.get('validUntil') as string).toISOString(),
    }

    const membershipTier = formData.get('membershipTier') as string
    if (membershipTier) {
      input.membershipTier = membershipTier
    }

    const minTotalSpent = formData.get('minTotalSpent') as string
    if (minTotalSpent) {
      input.minTotalSpent = parseFloat(minTotalSpent)
    }

    if (!confirm('確定要批量發放購物金嗎？這個操作無法撤銷。')) return

    await batchGrantCredit({ variables: { input } })
  }

  const credits = data?.credits?.credits || []
  const total = data?.credits?.total || 0
  const totalPages = data?.credits?.totalPages || 1

  const totalAmount = credits.reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0)
  const totalBalance = credits.reduce((sum: number, c: any) => sum + parseFloat(c.balance), 0)
  const usedAmount = totalAmount - totalBalance

  return (
    <div className="space-y-4 lg:space-y-6 -mx-4 px-4 lg:mx-0 lg:px-0">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">購物金管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            共 <span className="font-semibold">{total}</span> 筆記錄
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrantModal(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            + 發放
          </button>
        </div>
      </div>

      {/* 手機版統計摘要 */}
      <div className="lg:hidden grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-lg font-bold text-gray-900">${totalAmount.toFixed(0)}</p>
          <p className="text-xs text-gray-600 mt-1">總發放</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-lg font-bold text-green-600">${totalBalance.toFixed(0)}</p>
          <p className="text-xs text-gray-600 mt-1">剩餘</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-lg font-bold text-blue-600">${usedAmount.toFixed(0)}</p>
          <p className="text-xs text-gray-600 mt-1">已使用</p>
        </div>
      </div>

      {/* 統計卡片 - 桌面版 */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總發放金額</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalAmount.toFixed(0)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">剩餘餘額</p>
              <p className="text-2xl font-bold text-green-600 mt-1">${totalBalance.toFixed(0)}</p>
            </div>
            <div className="text-3xl">💵</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已使用</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">${usedAmount.toFixed(0)}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">記錄總數</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{total}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="bg-white p-3 lg:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2 mb-3 lg:mb-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-1"
          >
            <span className="text-sm">篩選</span>
            {(sourceFilter || statusFilter) && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {(sourceFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="lg:hidden px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
          >
            批量發放
          </button>
        </div>

        {/* 篩選選項 */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">全部來源</option>
              <option value="CAMPAIGN">活動獎勵</option>
              <option value="REFUND">退款</option>
              <option value="ADMIN_GRANT">管理員發放</option>
              <option value="BIRTHDAY">生日禮金</option>
              <option value="REVIEW">評論獎勵</option>
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

      {/* 手機版購物金卡片列表 */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : credits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">沒有找到符合條件的購物金記錄</p>
          </div>
        ) : (
          credits.map((credit: any) => (
            <div
              key={credit.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                {/* 用戶資訊 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{credit.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{credit.user.email}</p>
                  </div>
                  <button
                    onClick={() =>
                      updateCredit({
                        variables: {
                          id: credit.id,
                          input: { isActive: !credit.isActive },
                        },
                      })
                    }
                    className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                      credit.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {credit.isActive ? '啟用' : '停用'}
                  </button>
                </div>

                {/* 購物金詳情 */}
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sourceLabels[credit.source]?.color || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {sourceLabels[credit.source]?.icon} {sourceLabels[credit.source]?.label || credit.source}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ${parseFloat(credit.amount).toFixed(0)}
                  </span>
                  <span className="text-sm text-green-600">
                    餘額 ${parseFloat(credit.balance).toFixed(0)}
                  </span>
                </div>

                {/* 有效期 */}
                <div className="text-xs text-gray-500">
                  {format(new Date(credit.validFrom), 'yyyy/MM/dd')} ~ {format(new Date(credit.validUntil), 'yyyy/MM/dd')}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setEditingCredit(credit)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center"
                  >
                    調整餘額
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('確定要停用此購物金嗎？')) {
                        deleteCredit({ variables: { id: credit.id } })
                      }
                    }}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                  >
                    停用
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

      {/* 桌面版購物金列表 */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : credits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">沒有找到符合條件的購物金記錄</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用戶</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">來源</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">餘額</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">限制</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有效期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {credits.map((credit: any) => (
                  <tr key={credit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{credit.user.name}</span>
                        <span className="text-xs text-gray-500">{credit.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sourceLabels[credit.source]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sourceLabels[credit.source]?.icon} {sourceLabels[credit.source]?.label || credit.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">${parseFloat(credit.amount).toFixed(0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-600">
                          ${parseFloat(credit.balance).toFixed(0)}
                        </span>
                        {credit.isUsed && <span className="text-xs text-gray-500">已用完</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-gray-500">
                        {credit.maxUsagePerOrder && (
                          <span>單筆≤${parseFloat(credit.maxUsagePerOrder).toFixed(0)}</span>
                        )}
                        {credit.minOrderAmount && (
                          <span>訂單≥${parseFloat(credit.minOrderAmount).toFixed(0)}</span>
                        )}
                        {!credit.maxUsagePerOrder && !credit.minOrderAmount && <span>無限制</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-gray-500">
                        <span>{format(new Date(credit.validFrom), 'yyyy/MM/dd')}</span>
                        <span>~</span>
                        <span>{format(new Date(credit.validUntil), 'yyyy/MM/dd')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          updateCredit({
                            variables: {
                              id: credit.id,
                              input: { isActive: !credit.isActive },
                            },
                          })
                        }
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          credit.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {credit.isActive ? '✓ 啟用' : '✗ 停用'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCredit(credit)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          調整
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('確定要停用此購物金嗎？')) {
                              deleteCredit({ variables: { id: credit.id } })
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          停用
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

      {/* 發放購物金彈窗 */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">發放購物金</h2>

            <form onSubmit={handleGrantSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇用戶 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="搜尋用戶名稱、Email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                {usersData?.users?.users && usersData.users.users.length > 0 && (
                  <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {usersData.users.users.map((user: any) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user)
                          setUserSearch('')
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{selectedUser.name}</div>
                        <div className="text-xs text-gray-500">{selectedUser.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">來源</label>
                  <select
                    name="source"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN_GRANT">管理員發放</option>
                    <option value="CAMPAIGN">活動獎勵</option>
                    <option value="BIRTHDAY">生日禮金</option>
                    <option value="REVIEW">評論獎勵</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">單筆訂單最大使用金額</label>
                  <input
                    type="number"
                    name="maxUsagePerOrder"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最低訂單金額</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
                  <input
                    type="datetime-local"
                    name="validFrom"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    結束時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="validUntil"
                    defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGrantModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={granting || !selectedUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {granting ? '發放中...' : '確認發放'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 批量發放彈窗 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">批量發放購物金</h2>

            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠️ 將會發放給符合條件的所有用戶，請謹慎操作
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金額 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">會員等級</label>
                <select
                  name="membershipTier"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部會員</option>
                  <option value="BRONZE">銅卡</option>
                  <option value="SILVER">銀卡</option>
                  <option value="GOLD">金卡</option>
                  <option value="PLATINUM">白金卡</option>
                  <option value="DIAMOND">鑽石卡</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最低累計消費</label>
                <input
                  type="number"
                  name="minTotalSpent"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效期至 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="validUntil"
                  defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={batchGranting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {batchGranting ? '發放中...' : '確認批量發放'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 調整餘額彈窗 */}
      {editingCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">調整購物金餘額</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">用戶：{editingCredit.user.name}</div>
              <div className="text-sm text-gray-600">原始金額：${parseFloat(editingCredit.amount).toFixed(0)}</div>
              <div className="text-sm text-gray-600">當前餘額：${parseFloat(editingCredit.balance).toFixed(0)}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新餘額</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={parseFloat(editingCredit.balance)}
                  onChange={(e) => (editingCredit.newBalance = parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setEditingCredit(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() =>
                    updateCredit({
                      variables: {
                        id: editingCredit.id,
                        input: { balance: editingCredit.newBalance },
                      },
                    })
                  }
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? '更新中...' : '確認更新'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
