'use client'

import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

const GET_SOCIAL_LINKS = gql`
  query GetSocialLinks {
    socialLinks {
      id
      platform
      name
      url
      icon
      displayOrder
      isActive
      createdAt
      updatedAt
    }
  }
`

const CREATE_SOCIAL_LINK = gql`
  mutation CreateSocialLink($input: CreateSocialLinkInput!) {
    createSocialLink(input: $input) {
      id
      platform
      name
      url
      icon
      displayOrder
      isActive
    }
  }
`

const UPDATE_SOCIAL_LINK = gql`
  mutation UpdateSocialLink($id: ID!, $input: UpdateSocialLinkInput!) {
    updateSocialLink(id: $id, input: $input) {
      id
      platform
      name
      url
      icon
      displayOrder
      isActive
    }
  }
`

const DELETE_SOCIAL_LINK = gql`
  mutation DeleteSocialLink($id: ID!) {
    deleteSocialLink(id: $id) {
      success
    }
  }
`

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'line', label: 'LINE', icon: '💬' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
  { value: 'wechat', label: '微信', icon: '💬' },
  { value: 'weibo', label: '微博', icon: '📱' },
  { value: 'other', label: '其他', icon: '🔗' },
]

interface SocialLinkFormData {
  platform: string
  name: string
  url: string
  icon: string
  displayOrder: number
  isActive: boolean
}

export default function SocialLinksPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [formData, setFormData] = useState<SocialLinkFormData>({
    platform: 'facebook',
    name: '',
    url: '',
    icon: '📘',
    displayOrder: 0,
    isActive: true,
  })

  const { data, loading, refetch } = useQuery(GET_SOCIAL_LINKS, {
    fetchPolicy: 'network-only',
  })

  const [createLink, { loading: creating }] = useMutation(CREATE_SOCIAL_LINK, {
    onCompleted: () => {
      alert('社群連結創建成功！')
      setShowModal(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      alert(`創建失敗：${error.message}`)
    },
  })

  const [updateLink, { loading: updating }] = useMutation(UPDATE_SOCIAL_LINK, {
    onCompleted: () => {
      alert('社群連結更新成功！')
      setEditingLink(null)
      setShowModal(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`)
    },
  })

  const [deleteLink] = useMutation(DELETE_SOCIAL_LINK, {
    onCompleted: () => {
      alert('社群連結已刪除')
      refetch()
    },
    onError: (error) => {
      alert(`刪除失敗：${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      platform: 'facebook',
      name: '',
      url: '',
      icon: '📘',
      displayOrder: 0,
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const input = {
      platform: formData.platform,
      name: formData.name,
      url: formData.url,
      icon: formData.icon,
      displayOrder: parseInt(formData.displayOrder.toString()),
      isActive: formData.isActive,
    }

    if (editingLink) {
      await updateLink({
        variables: {
          id: editingLink.id,
          input,
        },
      })
    } else {
      await createLink({
        variables: { input },
      })
    }
  }

  const handleEdit = (link: any) => {
    setEditingLink(link)
    setFormData({
      platform: link.platform,
      name: link.name,
      url: link.url,
      icon: link.icon,
      displayOrder: link.displayOrder,
      isActive: link.isActive,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此社群連結嗎？')) return
    await deleteLink({ variables: { id } })
  }

  const handlePlatformChange = (platform: string) => {
    const platformInfo = PLATFORM_OPTIONS.find((p) => p.value === platform)
    setFormData({
      ...formData,
      platform,
      icon: platformInfo?.icon || '🔗',
    })
  }

  const socialLinks = data?.socialLinks || []
  const activeLinkCount = socialLinks.filter((link: any) => link.isActive).length

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">社群平台連結管理</h1>
          <p className="text-gray-600 mt-1">管理網站上顯示的社群媒體連結</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingLink(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 新增連結
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              🔗
            </div>
            <div>
              <p className="text-sm text-gray-600">總連結數</p>
              <p className="text-2xl font-bold text-gray-900">{socialLinks.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{activeLinkCount}</p>
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
                {socialLinks.length - activeLinkCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 社群連結列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  圖標
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  連結
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
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
              ) : socialLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    尚無社群連結
                  </td>
                </tr>
              ) : (
                socialLinks
                  .slice()
                  .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                  .map((link: any) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-3xl">{link.icon}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                        {link.platform}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {link.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 hover:underline truncate block max-w-xs"
                        >
                          {link.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {link.displayOrder}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            link.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {link.isActive ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleEdit(link)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 創建/編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLink ? '編輯社群連結' : '新增社群連結'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 平台選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  平台 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顯示名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例如：官方粉絲團"
                    required
                  />
                </div>

                {/* 圖標 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    圖標（Emoji）
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="📘"
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  連結網址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://facebook.com/yourpage"
                  required
                />
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序（數字越小越前面）
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                />
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

              {/* 預覽 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">預覽：</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{formData.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{formData.name || '（未設定）'}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {formData.url || '（未設定）'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 按鈕 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {creating || updating ? '處理中...' : editingLink ? '更新' : '創建'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingLink(null)
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
