'use client'

import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const GET_COUPONS = gql`
  query GetCoupons($search: String, $type: CouponType, $isActive: Boolean, $page: Int, $limit: Int) {
    coupons(search: $search, type: $type, isActive: $isActive, page: $page, limit: $limit) {
      coupons {
        id
        code
        name
        description
        type
        value
        minAmount
        maxDiscount
        usageLimit
        usedCount
        userLimit
        isActive
        isPublic
        validFrom
        validUntil
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

const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      id
      code
      name
    }
  }
`

const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: ID!, $input: UpdateCouponInput!) {
    updateCoupon(id: $id, input: $input) {
      id
      code
      name
    }
  }
`

const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id)
  }
`

const couponTypeLabels: Record<string, { label: string; color: string; desc: string }> = {
  PERCENTAGE: { label: '百分比折扣', color: 'bg-blue-100 text-blue-800', desc: '訂單金額折扣百分比' },
  FIXED: { label: '固定金額', color: 'bg-green-100 text-green-800', desc: '訂單金額固定減免' },
  FREE_SHIPPING: { label: '免運費', color: 'bg-purple-100 text-purple-800', desc: '免除運費' },
  BUY_X_GET_Y: { label: '買X送Y', color: 'bg-orange-100 text-orange-800', desc: '購買組合優惠' },
}

export default function CouponsManagementPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const limit = 20

  const { data, loading, refetch } = useQuery(GET_COUPONS, {
    variables: {
      search: search || undefined,
      type: typeFilter || undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'active',
      page,
      limit,
    },
    fetchPolicy: 'network-only',
  })

  const [createCoupon, { loading: creating }] = useMutation(CREATE_COUPON, {
    onCompleted: () => {
      toast.success('優惠券創建成功')
      setShowModal(false)
      setEditingCoupon(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`創建失敗：${error.message}`)
    },
  })

  const [updateCoupon, { loading: updating }] = useMutation(UPDATE_COUPON, {
    onCompleted: () => {
      toast.success('優惠券更新成功')
      setShowModal(false)
      setEditingCoupon(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [deleteCoupon] = useMutation(DELETE_COUPON, {
    onCompleted: () => {
      toast.success('優惠券已停用')
      refetch()
    },
    onError: (error) => {
      toast.error(`停用失敗：${error.message}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const input = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      type: formData.get('type') as string,
      value: parseFloat(formData.get('value') as string),
      minAmount: formData.get('minAmount') ? parseFloat(formData.get('minAmount') as string) : undefined,
      maxDiscount: formData.get('maxDiscount') ? parseFloat(formData.get('maxDiscount') as string) : undefined,
      usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit') as string) : undefined,
      userLimit: formData.get('userLimit') ? parseInt(formData.get('userLimit') as string) : undefined,
      validFrom: new Date(formData.get('validFrom') as string).toISOString(),
      validUntil: new Date(formData.get('validUntil') as string).toISOString(),
      isActive: formData.get('isActive') === 'true',
      isPublic: formData.get('isPublic') === 'true',
    }

    if (editingCoupon) {
      const updateInput: any = { ...input }
      delete updateInput.code // 不能修改代碼
      await updateCoupon({
        variables: {
          id: editingCoupon.id,
          input: updateInput,
        },
      })
    } else {
      await createCoupon({
        variables: { input },
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要停用此優惠券嗎？')) return
    await deleteCoupon({ variables: { id } })
  }

  const coupons = data?.coupons?.coupons || []
  const total = data?.coupons?.total || 0
  const totalPages = data?.coupons?.totalPages || 1

  return (
    <div className="space-y-4 lg:space-y-6 -mx-4 px-4 lg:mx-0 lg:px-0">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">折價券管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            共 <span className="font-semibold">{total}</span> 個優惠券
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null)
            setShowModal(true)
          }}
          className="px-3 py-2 lg:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm lg:text-base"
        >
          + 新增
        </button>
      </div>

      {/* 手機版統計摘要 */}
      <div className="lg:hidden grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-xl font-bold text-green-600">
            {coupons.filter((c: any) => c.isActive).length}
          </p>
          <p className="text-xs text-gray-600 mt-1">啟用中</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-xl font-bold text-red-600">
            {coupons.filter((c: any) => !c.isActive).length}
          </p>
          <p className="text-xs text-gray-600 mt-1">已停用</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-xl font-bold text-blue-600">
            {coupons.reduce((sum: number, c: any) => sum + c.usedCount, 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">使用次數</p>
        </div>
      </div>

      {/* 統計卡片 - 桌面版 */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總優惠券數</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
            <div className="text-3xl">🎟️</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">啟用中</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {coupons.filter((c: any) => c.isActive).length}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已停用</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {coupons.filter((c: any) => !c.isActive).length}
              </p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總使用次數</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {coupons.reduce((sum: number, c: any) => sum + c.usedCount, 0)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="bg-white p-3 lg:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2 mb-3 lg:mb-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜尋代碼、名稱..."
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
            {(typeFilter || statusFilter) && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {(typeFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* 篩選選項 */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200">
            <div className="hidden lg:block"></div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">全部類型</option>
              <option value="PERCENTAGE">百分比折扣</option>
              <option value="FIXED">固定金額</option>
              <option value="FREE_SHIPPING">免運費</option>
              <option value="BUY_X_GET_Y">買X送Y</option>
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

      {/* 手機版優惠券卡片列表 */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">沒有找到符合條件的優惠券</p>
          </div>
        ) : (
          coupons.map((coupon: any) => (
            <div
              key={coupon.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                {/* 優惠券標題 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-blue-600">{coupon.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          couponTypeLabels[coupon.type]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {couponTypeLabels[coupon.type]?.label || coupon.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{coupon.name}</p>
                  </div>
                  <button
                    onClick={() =>
                      updateCoupon({
                        variables: {
                          id: coupon.id,
                          input: { isActive: !coupon.isActive },
                        },
                      })
                    }
                    className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                      coupon.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {coupon.isActive ? '啟用' : '停用'}
                  </button>
                </div>

                {/* 優惠券詳情 */}
                <div className="flex items-center gap-4 text-sm mb-2">
                  <span className="font-semibold text-gray-900">
                    {coupon.type === 'PERCENTAGE'
                      ? `${parseFloat(coupon.value)}% 折扣`
                      : coupon.type === 'FIXED'
                      ? `$${parseFloat(coupon.value)} 折扣`
                      : '免運費'}
                  </span>
                  <span className="text-gray-500">
                    已用 {coupon.usedCount}{coupon.usageLimit && ` / ${coupon.usageLimit}`}
                  </span>
                </div>

                {/* 有效期 */}
                <div className="text-xs text-gray-500">
                  {format(new Date(coupon.validFrom), 'yyyy/MM/dd')} ~ {format(new Date(coupon.validUntil), 'yyyy/MM/dd')}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setEditingCoupon(coupon)
                      setShowModal(true)
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                  >
                    刪除
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

      {/* 桌面版優惠券列表 */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">沒有找到符合條件的優惠券</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代碼</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">類型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">折扣</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用次數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有效期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon: any) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-blue-600">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{coupon.name}</span>
                        {coupon.description && (
                          <span className="text-xs text-gray-500">{coupon.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          couponTypeLabels[coupon.type]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {couponTypeLabels[coupon.type]?.label || coupon.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {coupon.type === 'PERCENTAGE'
                          ? `${parseFloat(coupon.value)}%`
                          : coupon.type === 'FIXED'
                          ? `$${parseFloat(coupon.value)}`
                          : '免運'}
                      </span>
                      {coupon.maxDiscount && (
                        <span className="text-xs text-gray-500 block">上限${parseFloat(coupon.maxDiscount)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">
                          {coupon.usedCount}
                          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </span>
                        {coupon.usageLimit && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-gray-500">
                        <span>{format(new Date(coupon.validFrom), 'yyyy/MM/dd')}</span>
                        <span>~</span>
                        <span>{format(new Date(coupon.validUntil), 'yyyy/MM/dd')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          updateCoupon({
                            variables: {
                              id: coupon.id,
                              input: { isActive: !coupon.isActive },
                            },
                          })
                        }
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {coupon.isActive ? '✓ 啟用' : '✗ 停用'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCoupon(coupon)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          刪除
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

      {/* 新增/編輯彈窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl mx-4 my-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCoupon ? '編輯優惠券' : '新增優惠券'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優惠券代碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingCoupon?.code}
                    disabled={!!editingCoupon}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="如：WELCOME2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優惠券名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCoupon?.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：新會員優惠"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  name="description"
                  defaultValue={editingCoupon?.description}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="優惠券的詳細說明..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    類型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    defaultValue={editingCoupon?.type || 'PERCENTAGE'}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">百分比折扣</option>
                    <option value="FIXED">固定金額</option>
                    <option value="FREE_SHIPPING">免運費</option>
                    <option value="BUY_X_GET_Y">買X送Y</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    折扣值 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="value"
                    step="0.01"
                    defaultValue={editingCoupon?.value ? parseFloat(editingCoupon.value) : ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：10（代表10%或$10）"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最低訂單金額</label>
                  <input
                    type="number"
                    name="minAmount"
                    step="0.01"
                    defaultValue={editingCoupon?.minAmount ? parseFloat(editingCoupon.minAmount) : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最大折扣金額</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    step="0.01"
                    defaultValue={editingCoupon?.maxDiscount ? parseFloat(editingCoupon.maxDiscount) : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">總使用次數限制</label>
                  <input
                    type="number"
                    name="usageLimit"
                    defaultValue={editingCoupon?.usageLimit || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：100（留空=無限制）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">每人使用次數限制</label>
                  <input
                    type="number"
                    name="userLimit"
                    defaultValue={editingCoupon?.userLimit || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：1（留空=無限制）"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="validFrom"
                    defaultValue={
                      editingCoupon?.validFrom
                        ? new Date(editingCoupon.validFrom).toISOString().slice(0, 16)
                        : new Date().toISOString().slice(0, 16)
                    }
                    required
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
                    defaultValue={
                      editingCoupon?.validUntil
                        ? new Date(editingCoupon.validUntil).toISOString().slice(0, 16)
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">狀態</label>
                  <select
                    name="isActive"
                    defaultValue={editingCoupon?.isActive !== false ? 'true' : 'false'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">啟用</option>
                    <option value="false">停用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">公開</label>
                  <select
                    name="isPublic"
                    defaultValue={editingCoupon?.isPublic !== false ? 'true' : 'false'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">公開（用戶可領取）</option>
                    <option value="false">私人（只有管理員可發放）</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCoupon(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating || updating ? '儲存中...' : editingCoupon ? '更新' : '創建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
