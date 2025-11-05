'use client'

/**
 * 線上客服頁面 - /help
 *
 * 功能：
 * 1. 顯示常見問題 FAQ（來自資料庫）
 * 2. 線上留言客服功能
 * 3. 用戶可以創建新對話並查看回覆
 * 4. 不需要 WebSocket，採用輪詢方式
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { useAuth } from '@/contexts/AuthContext'
import FAQSection from '@/components/sections/FAQSection'
import Link from 'next/link'

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
        senderType
        isRead
        createdAt
      }
    }
  }
`

const CREATE_CONVERSATION = gql`
  mutation CreateConversation($subject: String, $message: String!) {
    createConversation(subject: $subject, message: $message) {
      id
      subject
      status
      createdAt
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $content: String!) {
    sendMessage(conversationId: $conversationId, content: $content) {
      id
      content
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
  const [showNewMessageForm, setShowNewMessageForm] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      setShowNewMessageForm(false)
      setNewSubject('')
      setNewMessage('')
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
      },
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation) return

    await sendMessage({
      variables: {
        conversationId: selectedConversation.id,
        content: messageInput,
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
                  📝 新增留言
                </button>
                <button
                  onClick={() => setShowChatSection(true)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    showChatSection
                      ? 'bg-white text-gray-900'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  💬 我的留言記錄 ({conversations.length})
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

                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {creating ? '送出中...' : '📤 送出留言'}
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
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="輸入您的訊息..."
                                className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white/60"
                                disabled={sending}
                              />
                              <button
                                type="submit"
                                disabled={sending || !messageInput.trim()}
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
              href="/orders"
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
