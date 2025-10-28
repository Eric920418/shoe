'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

const GET_ALL_CONVERSATIONS = gql`
  query GetAllConversations($skip: Int, $take: Int, $status: String) {
    allConversations(skip: $skip, take: $take, status: $status) {
      items {
        id
        subject
        status
        lastMessageAt
        createdAt
        user {
          id
          name
          email
        }
        messages {
          id
          content
          senderType
          senderId
          isRead
          createdAt
        }
      }
      total
      hasMore
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

const UPDATE_CONVERSATION_STATUS = gql`
  mutation UpdateConversationStatus($conversationId: ID!, $status: String!) {
    updateConversationStatus(conversationId: $conversationId, status: $status) {
      id
      status
    }
  }
`

const STATUS_OPTIONS = [
  { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-800' },
  { value: 'OPEN', label: '待處理', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_PROGRESS', label: '進行中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'RESOLVED', label: '已解決', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: '已關閉', color: 'bg-gray-100 text-gray-800' },
]

export default function AdminChatsPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const limit = 20
  const skip = page * limit

  const { data, loading, refetch } = useQuery(GET_ALL_CONVERSATIONS, {
    variables: {
      skip,
      take: limit,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    pollInterval: 5000, // 每5秒自動刷新
    fetchPolicy: 'network-only',
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

  const [updateStatus] = useMutation(UPDATE_CONVERSATION_STATUS, {
    onCompleted: () => {
      alert('狀態已更新')
      refetch()
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`)
    },
  })

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

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

  const handleStatusChange = async (conversationId: string, newStatus: string) => {
    await updateStatus({
      variables: {
        conversationId,
        status: newStatus,
      },
    })
  }

  const getStatusDisplay = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  }

  const conversations = data?.allConversations?.items || []
  const total = data?.allConversations?.total || 0

  // 統計數據
  const stats = {
    total: total,
    open: conversations.filter((c: any) => c.status === 'OPEN').length,
    inProgress: conversations.filter((c: any) => c.status === 'IN_PROGRESS').length,
    resolved: conversations.filter((c: any) => c.status === 'RESOLVED').length,
  }

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">客服聊天管理</h1>
        <p className="text-gray-600 mt-1">管理所有客戶諮詢對話</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <p className="text-sm text-gray-600">總對話數</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
              🔴
            </div>
            <div>
              <p className="text-sm text-gray-600">待處理</p>
              <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
              🟡
            </div>
            <div>
              <p className="text-sm text-gray-600">進行中</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <p className="text-sm text-gray-600">已解決</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="mb-6 flex gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => {
              setStatusFilter(status.value)
              setPage(0)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 對話列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">對話列表</h2>
            </div>

            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">載入中...</div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  沒有符合條件的對話
                </div>
              ) : (
                conversations.map((conv: any) => {
                  const status = getStatusDisplay(conv.status)
                  const isSelected = selectedConversation?.id === conv.id
                  const unreadCount = conv.messages.filter(
                    (m: any) => m.senderType === 'USER' && !m.isRead
                  ).length

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {conv.subject}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {conv.user.name} ({conv.user.email})
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(conv.lastMessageAt).toLocaleString('zh-TW', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 分頁 */}
            {total > limit && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {skip + 1} - {Math.min(skip + limit, total)} / {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一頁
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!data?.allConversations?.hasMore}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 對話內容 */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
              {/* 對話標題 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedConversation.subject}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      客戶：{selectedConversation.user.name} ({selectedConversation.user.email})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      創建於 {new Date(selectedConversation.createdAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>

                {/* 狀態更新 */}
                <div className="flex gap-2">
                  <label className="text-sm font-medium text-gray-700 self-center">
                    狀態：
                  </label>
                  <select
                    value={selectedConversation.status}
                    onChange={(e) =>
                      handleStatusChange(selectedConversation.id, e.target.value)
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 訊息列表 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedConversation.messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        msg.senderType === 'ADMIN'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {msg.senderType === 'ADMIN' ? '客服' : selectedConversation.user.name}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderType === 'ADMIN' ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
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

              {/* 輸入框 */}
              <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="輸入回覆訊息..."
                    rows={2}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    {sending ? '發送中...' : '發送'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">提示：按 Enter 發送，Shift+Enter 換行</p>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">請選擇一個對話開始回覆</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
