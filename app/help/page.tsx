'use client'

/**
 * 線上客服頁面 - /help
 *
 * 功能：
 * 1. 顯示常見問題 FAQ（來自資料庫）
 * 2. 線上留言客服功能（支援圖片上傳）
 * 3. 用戶可以創建新對話並查看回覆
 * 4. 不需要 WebSocket，採用輪詢方式
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { useAuth } from '@/contexts/AuthContext'
import FAQSection from '@/components/sections/FAQSection'
import Link from 'next/link'
import Image from 'next/image'

const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations {
    myConversations {
      id
      subject
      status
      lastMessageAt
      createdAt
      messages {
        id
        content
        imageUrl
        senderType
        isRead
        createdAt
      }
    }
  }
`

const CREATE_CONVERSATION = gql`
  mutation CreateConversation($subject: String, $message: String!, $imageUrl: String) {
    createConversation(subject: $subject, message: $message, imageUrl: $imageUrl) {
      id
      subject
      status
      createdAt
      lastMessageAt
      messages {
        id
        content
        imageUrl
        senderType
        isRead
        createdAt
      }
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $content: String!, $imageUrl: String) {
    sendMessage(conversationId: $conversationId, content: $content, imageUrl: $imageUrl) {
      id
      content
      imageUrl
      senderType
      isRead
      createdAt
    }
  }
`

export default function HelpPage() {
  const { user } = useAuth()
  const [showChatSection, setShowChatSection] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 圖片上傳狀態
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [messageImageUrl, setMessageImageUrl] = useState<string | null>(null)
  const [messageImagePreview, setMessageImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const newImageInputRef = useRef<HTMLInputElement>(null)
  const messageImageInputRef = useRef<HTMLInputElement>(null)

  // 查詢用戶的對話
  const { data, loading, refetch } = useQuery(GET_MY_CONVERSATIONS, {
    skip: !user,
    pollInterval: selectedConversation ? 10000 : 0, // 10 秒輪詢一次
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  })

  const [createConversation, { loading: creating }] = useMutation(CREATE_CONVERSATION, {
    onCompleted: (data) => {
      alert('留言已成功送出！客服人員會盡快回覆您。')
      setNewSubject('')
      setNewMessage('')
      setNewImageUrl(null)
      setNewImagePreview(null)
      refetch()
      setSelectedConversation(data.createConversation)
      setShowChatSection(true)
    },
    onError: (error) => {
      alert(`送出失敗：${error.message}`)
    },
  })

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      setMessageInput('')
      setMessageImageUrl(null)
      setMessageImagePreview(null)
      refetch()
    },
    onError: (error) => {
      alert(`發送失敗：${error.message}`)
    },
  })

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const conversations = data?.myConversations || []

  // 圖片上傳處理
  const handleImageUpload = async (
    file: File,
    setImageUrl: (url: string | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    if (!file) return

    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('僅支援 JPG、PNG、WebP 格式的圖片')
      return
    }

    // 驗證檔案大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB')
      return
    }

    // 設置預覽
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // 上傳圖片
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'support')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上傳失敗')
      }

      const data = await response.json()
      setImageUrl(data.url)
    } catch (error: any) {
      alert(`圖片上傳失敗：${error.message}`)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('請先登入才能使用線上客服功能')
      return
    }
    await createConversation({
      variables: {
        subject: newSubject || '客服諮詢',
        message: newMessage,
        imageUrl: newImageUrl,
      },
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!messageInput.trim() && !messageImageUrl) || !selectedConversation) return

    await sendMessage({
      variables: {
        conversationId: selectedConversation.id,
        content: messageInput || '（圖片）',
        imageUrl: messageImageUrl,
      },
    })
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: any = {
      OPEN: { label: '待處理', color: 'bg-blue-100 text-blue-800' },
      RESOLVED: { label: '已解決', color: 'bg-green-100 text-green-800' },
      CLOSED: { label: '已關閉', color: 'bg-gray-100 text-gray-800' },
    }
    return statusMap[status] || statusMap.OPEN
  }

  // 移除圖片
  const removeNewImage = () => {
    setNewImageUrl(null)
    setNewImagePreview(null)
    if (newImageInputRef.current) {
      newImageInputRef.current.value = ''
    }
  }

  const removeMessageImage = () => {
    setMessageImageUrl(null)
    setMessageImagePreview(null)
    if (messageImageInputRef.current) {
      messageImageInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero 區塊 */}
      <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white py-20 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 tracking-tight">
            我們能為您提供什麼幫助？
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            瀏覽常見問題，或直接透過線上留言聯繫客服團隊
          </p>
        </div>
      </section>

      {/* 線上客服留言區塊 */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              線上客服留言
            </h2>
            <p className="text-lg text-gray-300">
              {user ? '填寫以下表單，我們會盡快回覆您的訊息' : '請先登入後使用線上客服功能'}
            </p>
          </div>

          {user ? (
            <>
              {/* 切換按鈕 */}
              <div className="flex gap-4 mb-6 justify-center">
                <button
                  onClick={() => setShowChatSection(false)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    !showChatSection
                      ? 'bg-white text-gray-900'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  新增留言
                </button>
                <button
                  onClick={() => setShowChatSection(true)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    showChatSection
                      ? 'bg-white text-gray-900'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  我的留言記錄 ({conversations.length})
                </button>
              </div>

              {/* 新增留言表單 */}
              {!showChatSection && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
                  <form onSubmit={handleCreateConversation} className="space-y-6">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        主旨（選填）
                      </label>
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white/60"
                        placeholder="例如：訂單查詢、產品問題、退換貨等"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">
                        留言內容 <span className="text-red-300">*</span>
                      </label>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white/60"
                        placeholder="請詳細描述您的問題，我們會盡快回覆..."
                        required
                      />
                    </div>

                    {/* 圖片上傳區域 */}
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        附加圖片（選填）
                      </label>
                      <input
                        ref={newImageInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, setNewImageUrl, setNewImagePreview)
                          }
                        }}
                        className="hidden"
                      />

                      {newImagePreview ? (
                        <div className="relative inline-block">
                          <Image
                            src={newImagePreview}
                            alt="預覽圖片"
                            width={200}
                            height={200}
                            className="rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeNewImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                          {uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <div className="text-white text-sm">上傳中...</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => newImageInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-lg hover:border-white/50 transition-colors flex flex-col items-center gap-2 text-white/70 hover:text-white disabled:opacity-50"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>點擊上傳圖片</span>
                          <span className="text-xs text-white/50">支援 JPG、PNG、WebP（最大 5MB）</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={creating || uploading}
                      className="w-full px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {creating ? '送出中...' : '送出留言'}
                    </button>
                  </form>
                </div>
              )}

              {/* 留言記錄與對話區 */}
              {showChatSection && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 對話列表 */}
                  <div className="lg:col-span-1">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/20">
                        <h3 className="font-bold text-white">留言列表</h3>
                      </div>

                      <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto">
                        {loading ? (
                          <div className="px-4 py-8 text-center text-gray-300">載入中...</div>
                        ) : conversations.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-300">
                            尚無留言記錄
                          </div>
                        ) : (
                          conversations.map((conv: any) => {
                            const status = getStatusDisplay(conv.status)
                            const isSelected = selectedConversation?.id === conv.id
                            return (
                              <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-white/20' : 'hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="font-medium text-white text-sm truncate flex-1">
                                    {conv.subject}
                                  </h4>
                                  <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-300">
                                  {new Date(conv.lastMessageAt).toLocaleString('zh-TW', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 對話內容 */}
                  <div className="lg:col-span-2">
                    {selectedConversation ? (
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex flex-col h-[500px]">
                        {/* 對話標題 */}
                        <div className="px-6 py-4 border-b border-white/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {selectedConversation.subject}
                              </h3>
                              <p className="text-sm text-gray-300 mt-1">
                                創建於 {new Date(selectedConversation.createdAt).toLocaleString('zh-TW')}
                              </p>
                            </div>
                            <span
                              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                getStatusDisplay(selectedConversation.status).color
                              }`}
                            >
                              {getStatusDisplay(selectedConversation.status).label}
                            </span>
                          </div>
                        </div>

                        {/* 訊息列表 */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {selectedConversation.messages.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                                  msg.senderType === 'USER'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white/20 text-white border border-white/30'
                                }`}
                              >
                                <p className="text-xs font-semibold mb-1 opacity-75">
                                  {msg.senderType === 'USER' ? '我' : '客服'}
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                {/* 顯示圖片 */}
                                {msg.imageUrl && (
                                  <div className="mt-2">
                                    <a
                                      href={msg.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <Image
                                        src={msg.imageUrl}
                                        alt="附加圖片"
                                        width={200}
                                        height={200}
                                        className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                    </a>
                                  </div>
                                )}
                                <p className="text-xs mt-1 opacity-75">
                                  {new Date(msg.createdAt).toLocaleString('zh-TW', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* 回覆輸入框 */}
                        {selectedConversation.status !== 'CLOSED' && (
                          <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-white/20">
                            {/* 圖片預覽 */}
                            {messageImagePreview && (
                              <div className="relative inline-block mb-3">
                                <Image
                                  src={messageImagePreview}
                                  alt="預覽圖片"
                                  width={100}
                                  height={100}
                                  className="rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={removeMessageImage}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                                >
                                  ×
                                </button>
                                {uploading && (
                                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                    <div className="text-white text-xs">上傳中...</div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex gap-3">
                              <input
                                ref={messageImageInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleImageUpload(file, setMessageImageUrl, setMessageImagePreview)
                                  }
                                }}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => messageImageInputRef.current?.click()}
                                disabled={uploading || sending}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                                title="上傳圖片"
                              >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="輸入您的訊息..."
                                className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white/60"
                                disabled={sending || uploading}
                              />
                              <button
                                type="submit"
                                disabled={sending || uploading || (!messageInput.trim() && !messageImageUrl)}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sending ? '發送中...' : '發送'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 h-[500px] flex items-center justify-center">
                        <div className="text-center text-gray-300">
                          <div className="text-6xl mb-4">💬</div>
                          <p className="text-lg">請選擇一個留言查看對話內容</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            // 未登入狀態
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
                <div className="text-6xl mb-6">🔐</div>
                <h3 className="text-2xl font-bold text-white mb-4">需要登入才能使用線上客服</h3>
                <p className="text-gray-300 mb-8">登入後即可留言諮詢，客服人員會盡快回覆您</p>
                <Link
                  href="/auth/login"
                  className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  前往登入
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ 區塊 */}
      <FAQSection />

      {/* 快速指南卡片 */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 text-gray-900">
            快速指南
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 訂單追蹤 */}
            <Link
              href="/account/orders"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105"
            >
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                訂單追蹤
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                查看您的訂單狀態、物流資訊和配送進度
              </p>
            </Link>

            {/* 退換貨政策 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105 cursor-pointer">
              <div className="text-5xl mb-4">↩️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                退換貨政策
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                7 天鑑賞期，14 天內可退換貨（商品須保持完整）
              </p>
            </div>

            {/* 配送資訊 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105 cursor-pointer">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                配送資訊
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                全台免運，1-3 個工作日送達，支援超商取貨
              </p>
            </div>

            {/* 會員權益 */}
            <Link
              href="/account/wallet"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105"
            >
              <div className="text-5xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                會員權益
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                累計消費升級會員等級，享受購物金回饋
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 其他聯繫方式 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 text-gray-900">
            其他聯繫方式
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Email 客服 */}
            <a
              href="mailto:support@shoes.com"
              className="group bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all border border-gray-200 hover:border-orange-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">📧</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
                    Email 客服
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    support@shoes.com<br />
                    24 小時內回覆
                  </p>
                  <span className="inline-block text-sm font-semibold text-orange-600">
                    發送郵件 →
                  </span>
                </div>
              </div>
            </a>

            {/* 電話客服 */}
            <div className="group bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all border border-gray-200 hover:border-orange-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">📞</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
                    電話客服
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    0800-123-456<br />
                    週一至週日 9:00 - 21:00
                  </p>
                  <span className="inline-block text-sm font-semibold text-orange-600">
                    立即撥打 →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
