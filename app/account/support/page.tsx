'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { useAuth } from '@/contexts/AuthContext'
import AccountHeader from '@/components/navigation/AccountHeader'

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
  mutation SendMessage($conversationId: ID!, $message: String!) {
    sendMessage(conversationId: $conversationId, message: $message) {
      id
      content
      senderType
      isRead
      createdAt
    }
  }
`

export default function SupportPage() {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ✅ 優化：只在選中對話時才輪詢，避免無意義的資源消耗
  const { data, loading, refetch } = useQuery(GET_MY_CONVERSATIONS, {
    skip: !user,
    // 只在有選中對話時才啟用輪詢（避免閒置時持續請求）
    pollInterval: selectedConversation ? 10000 : 0, // 提高到 10 秒
    fetchPolicy: 'cache-first', // 優先使用快取
    nextFetchPolicy: 'cache-first', // 後續請求也優先快取
  })

  const [createConversation, { loading: creating }] = useMutation(CREATE_CONVERSATION, {
    onCompleted: (data) => {
      alert('客服對話已創建！')
      setShowNewChat(false)
      setNewSubject('')
      setNewMessage('')
      refetch()
      setSelectedConversation(data.createConversation)
    },
    onError: (error) => {
      alert(`創建失敗：${error.message}`)
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

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">請先登入使用客服功能</p>
      </div>
    )
  }

  const conversations = data?.myConversations || []

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()
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
        message: messageInput,
      },
    })
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: any = {
      OPEN: { label: '處理中', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: '進行中', color: 'bg-yellow-100 text-yellow-800' },
      RESOLVED: { label: '已解決', color: 'bg-green-100 text-green-800' },
      CLOSED: { label: '已關閉', color: 'bg-gray-100 text-gray-800' },
    }
    return statusMap[status] || statusMap.OPEN
  }

  return (
    <>
      <AccountHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">客服中心</h1>
        <p className="text-gray-600 mt-2">有任何問題嗎？我們隨時為您服務</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 對話列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">我的對話</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
              >
                + 新對話
              </button>
            </div>

            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">載入中...</div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  尚無對話記錄<br />點擊「新對話」開始諮詢
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
                        isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate flex-1">
                          {conv.subject}
                        </h3>
                        <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(conv.lastMessageAt).toLocaleString('zh-TW')}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {conv.messages[conv.messages.length - 1]?.content}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
              {/* 對話標題 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedConversation.subject}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
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
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderType === 'USER' ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('zh-TW', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 輸入框 */}
              {selectedConversation.status !== 'CLOSED' && (
                <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="輸入您的訊息..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageInput.trim()}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? '發送中...' : '發送'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">請選擇一個對話或創建新對話</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新對話 Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">開始新對話</h2>
            </div>

            <form onSubmit={handleCreateConversation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主旨（選填）
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例如：訂單查詢、產品問題等"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  訊息 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="請描述您的問題..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {creating ? '創建中...' : '創建對話'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewChat(false)
                    setNewSubject('')
                    setNewMessage('')
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
    </>
  )
}
