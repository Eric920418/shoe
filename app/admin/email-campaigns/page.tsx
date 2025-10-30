'use client'

/**
 * 郵件行銷管理頁面
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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

export default function EmailCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

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
      fetchCampaigns()
    } catch (error: any) {
      toast.error(error.message || '創建郵件活動失敗')
    }
  }

  // 發送郵件活動
  const handleSend = async (id: string, name: string) => {
    if (!confirm(`確定要發送「${name}」嗎？發送後無法撤回。`)) {
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
            <div>
              <label className="block text-sm font-medium mb-2">郵件內容（HTML）</label>
              <textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 h-64 font-mono text-sm"
                placeholder="<h1>歡迎參加我們的特賣活動！</h1><p>活動詳情...</p>"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                支援 HTML 標籤。退訂連結會自動加入郵件底部。
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
                      <button
                        onClick={() => handleSend(campaign.id, campaign.name)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        發送
                      </button>
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

      {/* 環境變數提示 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 配置提示</h3>
        <p className="text-sm text-yellow-700 mb-2">
          使用郵件功能前，請在 <code className="bg-yellow-100 px-1">.env</code> 中設定：
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          <li>SMTP_HOST - SMTP 伺服器地址（例如：smtp.gmail.com）</li>
          <li>SMTP_PORT - SMTP 端口（通常為 587）</li>
          <li>SMTP_USER - SMTP 帳號</li>
          <li>SMTP_PASSWORD - SMTP 密碼</li>
          <li>SMTP_FROM_EMAIL - 發件人郵件地址</li>
          <li>SMTP_FROM_NAME - 發件人名稱</li>
        </ul>
      </div>
    </div>
  )
}
