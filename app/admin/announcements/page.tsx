'use client'

import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

const GET_ANNOUNCEMENTS = gql`
  query GetAnnouncements($skip: Int, $take: Int, $where: JSON) {
    announcements(skip: $skip, take: $take, where: $where) {
      items {
        id
        title
        content
        type
        priority
        isActive
        startDate
        endDate
        actionUrl
        actionLabel
        createdBy
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`

const CREATE_ANNOUNCEMENT = gql`
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      id
      title
      content
      type
      priority
      isActive
      startDate
      endDate
      actionUrl
      actionLabel
      createdAt
    }
  }
`

const UPDATE_ANNOUNCEMENT = gql`
  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {
    updateAnnouncement(id: $id, input: $input) {
      id
      title
      content
      type
      priority
      isActive
      startDate
      endDate
      actionUrl
      actionLabel
      updatedAt
    }
  }
`

const DELETE_ANNOUNCEMENT = gql`
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id) {
      success
    }
  }
`

const ANNOUNCEMENT_TYPES = [
  { value: 'INFO', label: '一般資訊', color: 'bg-blue-100 text-blue-800' },
  { value: 'SUCCESS', label: '成功訊息', color: 'bg-green-100 text-green-800' },
  { value: 'WARNING', label: '警告', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ERROR', label: '錯誤', color: 'bg-red-100 text-red-800' },
  { value: 'PROMOTION', label: '促銷活動', color: 'bg-purple-100 text-purple-800' },
  { value: 'MAINTENANCE', label: '系統維護', color: 'bg-gray-100 text-gray-800' },
]

interface AnnouncementFormData {
  title: string
  content: string
  type: string
  priority: number
  isActive: boolean
  startDate: string
  endDate: string
  actionUrl: string
  actionLabel: string
}

export default function AnnouncementsPage() {
  const [page, setPage] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'INFO',
    priority: 0,
    isActive: true,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    actionUrl: '',
    actionLabel: '',
  })

  const limit = 20
  const skip = page * limit

  const { data, loading, refetch } = useQuery(GET_ANNOUNCEMENTS, {
    variables: { skip, take: limit },
    fetchPolicy: 'network-only',
  })

  const [createAnnouncement, { loading: creating }] = useMutation(CREATE_ANNOUNCEMENT, {
    onCompleted: () => {
      alert('公告創建成功！')
      setShowCreateModal(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      alert(`創建失敗：${error.message}`)
    },
  })

  const [updateAnnouncement, { loading: updating }] = useMutation(UPDATE_ANNOUNCEMENT, {
    onCompleted: () => {
      alert('公告更新成功！')
      setShowCreateModal(false)
      setEditingAnnouncement(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`)
    },
  })

  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, {
    onCompleted: () => {
      alert('公告已刪除')
      refetch()
    },
    onError: (error) => {
      alert(`刪除失敗：${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      priority: 0,
      isActive: true,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
      actionUrl: '',
      actionLabel: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const input = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      priority: parseInt(formData.priority.toString()),
      isActive: formData.isActive,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      actionUrl: formData.actionUrl || null,
      actionLabel: formData.actionLabel || null,
    }

    if (editingAnnouncement) {
      await updateAnnouncement({
        variables: {
          id: editingAnnouncement.id,
          input,
        },
      })
    } else {
      await createAnnouncement({
        variables: { input },
      })
    }
  }

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isActive: announcement.isActive,
      startDate: new Date(announcement.startDate).toISOString().slice(0, 16),
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : '',
      actionUrl: announcement.actionUrl || '',
      actionLabel: announcement.actionLabel || '',
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此公告嗎？')) return
    await deleteAnnouncement({ variables: { id } })
  }

  const getTypeDisplay = (type: string) => {
    const typeInfo = ANNOUNCEMENT_TYPES.find((t) => t.value === type)
    return typeInfo || ANNOUNCEMENT_TYPES[0]
  }

  const announcements = data?.announcements?.items || []
  const total = data?.announcements?.total || 0

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
          <p className="text-gray-600 mt-1">管理系統公告和通知訊息</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingAnnouncement(null)
            setShowCreateModal(true)
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 新增公告
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              📢
            </div>
            <div>
              <p className="text-sm text-gray-600">總公告數</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <p className="text-sm text-gray-600">啟用中</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter((a: any) => a.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              ⏸️
            </div>
            <div>
              <p className="text-sm text-gray-600">已停用</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter((a: any) => !a.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 公告列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  標題
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  優先級
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  開始時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  結束時間
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    載入中...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    尚無公告
                  </td>
                </tr>
              ) : (
                announcements.map((announcement: any) => {
                  const typeInfo = getTypeDisplay(announcement.type)
                  return (
                    <tr key={announcement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{announcement.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {announcement.content}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {announcement.priority}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            announcement.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {announcement.isActive ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(announcement.startDate).toLocaleString('zh-TW')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {announcement.endDate
                          ? new Date(announcement.endDate).toLocaleString('zh-TW')
                          : '無期限'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              顯示 {skip + 1} - {Math.min(skip + limit, total)} / 共 {total} 筆
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一頁
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data?.announcements?.hasMore}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 創建/編輯公告 Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAnnouncement ? '編輯公告' : '新增公告'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 標題 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="請輸入公告標題"
                  required
                />
              </div>

              {/* 內容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  內容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="請輸入公告內容"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 類型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {ANNOUNCEMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 優先級 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    優先級（數字越大越優先）
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 開始時間 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* 結束時間 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結束時間（選填）
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 行動連結 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    行動連結（選填）
                  </label>
                  <input
                    type="text"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="/products"
                  />
                </div>

                {/* 行動按鈕文字 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    按鈕文字（選填）
                  </label>
                  <input
                    type="text"
                    value={formData.actionLabel}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="查看更多"
                  />
                </div>
              </div>

              {/* 狀態 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  立即啟用
                </label>
              </div>

              {/* 按鈕 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {creating || updating ? '處理中...' : editingAnnouncement ? '更新' : '創建'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingAnnouncement(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
