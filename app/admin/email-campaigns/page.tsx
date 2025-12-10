'use client'

/**
 * 郵件行銷管理頁面
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Upload, Copy, ImagePlus, Trash2 } from 'lucide-react'

type EmailCampaign = {
  id: string
  name: string
  subject: string
  status: string
  totalRecipients: number
  successCount: number
  failedCount: number
  createdAt: string
  sentAt?: string
}

type UploadedImage = {
  url: string
  name: string
}

export default function EmailCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
  })

  // 載入郵件活動列表
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              emailCampaigns {
                items {
                  id
                  name
                  subject
                  status
                  totalRecipients
                  successCount
                  failedCount
                  createdAt
                  sentAt
                }
              }
            }
          `,
        }),
      })

      const json = await res.json()
      if (json.errors) {
        throw new Error(json.errors[0]?.message || '載入失敗')
      }

      setCampaigns(json.data.emailCampaigns.items)
    } catch (error: any) {
      toast.error(error.message || '載入郵件活動失敗')
    } finally {
      setLoading(false)
    }
  }

  // 創建郵件活動
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast.error('請填寫所有必填欄位')
      return
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateEmailCampaign($input: CreateEmailCampaignInput!) {
              createEmailCampaign(input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            input: formData,
          },
        }),
      })

      const json = await res.json()
      if (json.errors) {
        throw new Error(json.errors[0]?.message || '創建失敗')
      }

      toast.success('郵件活動創建成功')
      setShowCreateForm(false)
      setFormData({ name: '', subject: '', htmlContent: '' })
      setUploadedImages([])
      fetchCampaigns()
    } catch (error: any) {
      toast.error(error.message || '創建郵件活動失敗')
    }
  }

  // 預覽收件人數量
  const previewRecipients = async (id: string) => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              emailPreviewStats(targetAudience: {}) {
                totalRecipients
                subscribedUsers
              }
            }
          `,
        }),
      })

      const json = await res.json()
      if (json.errors) {
        throw new Error(json.errors[0]?.message || '預覽失敗')
      }

      return json.data.emailPreviewStats
    } catch (error: any) {
      toast.error(error.message || '預覽失敗')
      return null
    }
  }

  // 發送郵件活動
  const handleSend = async (id: string, name: string) => {
    // 先預覽收件人數量
    const preview = await previewRecipients(id)
    if (!preview) return

    if (preview.subscribedUsers === 0) {
      toast.error('沒有訂閱用戶！請確保至少有一個用戶開啟了郵件訂閱。')
      return
    }

    if (!confirm(
      `確定要發送「${name}」嗎？\n\n` +
      `📊 預覽統計：\n` +
      `• 總用戶數：${preview.totalRecipients} 人\n` +
      `• 訂閱用戶：${preview.subscribedUsers} 人\n\n` +
      `✅ 將發送給 ${preview.subscribedUsers} 位訂閱用戶\n\n` +
      `發送後無法撤回！`
    )) {
      return
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation SendEmailCampaign($id: ID!) {
              sendEmailCampaign(id: $id) {
                id
                status
              }
            }
          `,
          variables: { id },
        }),
      })

      const json = await res.json()
      if (json.errors) {
        throw new Error(json.errors[0]?.message || '發送失敗')
      }

      toast.success('郵件正在發送中，請稍後查看發送記錄')
      fetchCampaigns()
    } catch (error: any) {
      toast.error(error.message || '發送郵件失敗')
    }
  }

  // 測試發送郵件
  const handleTestSend = async (id: string, name: string) => {
    const testEmail = prompt('請輸入接收測試郵件的郵箱地址：')

    if (!testEmail) return

    // 驗證郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      toast.error('無效的郵箱地址')
      return
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation SendTestEmail($id: ID!, $testEmail: String!) {
              sendTestEmail(id: $id, testEmail: $testEmail)
            }
          `,
          variables: { id, testEmail },
        }),
      })

      const json = await res.json()
      if (json.errors) {
        throw new Error(json.errors[0]?.message || '測試發送失敗')
      }

      toast.success(`測試郵件已發送到 ${testEmail}`)
    } catch (error: any) {
      toast.error(error.message || '測試發送失敗')
    }
  }

  // 圖片上傳處理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 驗證文件大小（5MB）
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} 大小超過 5MB 限制`)
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'email-campaigns')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '上傳失敗')
        }

        const data = await response.json()
        return {
          url: data.url,
          name: file.name,
        }
      })

      const newImages = await Promise.all(uploadPromises)
      setUploadedImages((prev) => [...prev, ...newImages])
      toast.success(`成功上傳 ${newImages.length} 張圖片`)
    } catch (error: any) {
      console.error('圖片上傳失敗:', error)
      toast.error(error.message || '圖片上傳失敗，請重試')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // 複製圖片 URL
  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('圖片網址已複製')
  }

  // 插入圖片到郵件內容
  const insertImageToContent = (url: string) => {
    const imgTag = `<img src="${url}" alt="郵件圖片" style="max-width: 100%; height: auto;" />`

    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const content = formData.htmlContent
      const newContent = content.substring(0, start) + imgTag + content.substring(end)

      setFormData({ ...formData, htmlContent: newContent })

      // 重新設定游標位置
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + imgTag.length
      }, 0)
    } else {
      // 如果無法取得游標位置，附加到最後
      setFormData({
        ...formData,
        htmlContent: formData.htmlContent + '\n' + imgTag,
      })
    }

    toast.success('圖片已插入到郵件內容')
  }

  // 刪除上傳的圖片
  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    toast.success('圖片已移除')
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">載入中...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">郵件行銷管理</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          {showCreateForm ? '取消' : '創建新活動'}
        </button>
      </div>

      {/* 創建表單 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">創建郵件活動</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">活動名稱</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="例如：2025 年終特賣"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">郵件主旨</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="例如：全場 7 折優惠，僅此一周！"
                required
              />
            </div>
            {/* 圖片上傳區域 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium mb-3">郵件圖片</label>

              {/* 上傳按鈕 */}
              <div className="flex items-center gap-4 mb-4">
                <label className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {uploading ? '上傳中...' : '上傳圖片'}
                  </span>
                </label>
                <p className="text-xs text-gray-500">支援 JPG、PNG、WebP、GIF，單個不超過 5MB</p>
              </div>

              {/* 已上傳的圖片列表 */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {uploadedImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative bg-white rounded-lg border border-gray-200 overflow-hidden group"
                    >
                      <div className="aspect-video relative">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                        {/* 操作按鈕 overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => insertImageToContent(img.url)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="插入到郵件內容"
                          >
                            <ImagePlus size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyImageUrl(img.url)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="複製圖片網址"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(index)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="移除圖片"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-500 truncate" title={img.name}>
                          {img.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  尚未上傳任何圖片。上傳後可以插入到郵件內容中。
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">郵件內容（HTML）</label>
              <textarea
                ref={textareaRef}
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 h-64 font-mono text-sm"
                placeholder="<h1>歡迎參加我們的特賣活動！</h1><p>活動詳情...</p>"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                支援 HTML 標籤。退訂連結會自動加入郵件底部。點擊上方圖片的綠色按鈕可快速插入圖片。
              </p>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                創建活動
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 郵件活動列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">活動名稱</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">主旨</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">狀態</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">收件人</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">成功/失敗</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">創建時間</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  尚無郵件活動，點擊「創建新活動」開始
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{campaign.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.subject}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'SENT'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'SENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : campaign.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status === 'DRAFT' && '草稿'}
                      {campaign.status === 'SENDING' && '發送中'}
                      {campaign.status === 'SENT' && '已發送'}
                      {campaign.status === 'FAILED' && '發送失敗'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{campaign.totalRecipients}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-green-600">{campaign.successCount}</span> /{' '}
                    <span className="text-red-600">{campaign.failedCount}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(campaign.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4">
                    {campaign.status === 'DRAFT' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestSend(campaign.id, campaign.name)}
                          className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
                          title="發送測試郵件"
                        >
                          測試
                        </button>
                        <button
                          onClick={() => handleSend(campaign.id, campaign.name)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                        >
                          發送
                        </button>
                      </div>
                    )}
                    {campaign.status === 'SENT' && (
                      <span className="text-sm text-gray-500">
                        {campaign.sentAt &&
                          new Date(campaign.sentAt).toLocaleString('zh-TW')}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
