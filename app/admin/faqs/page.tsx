'use client'

import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

const GET_FAQS = gql`
  query GetAllFaqs($skip: Int, $take: Int, $category: String) {
    allFaqs(skip: $skip, take: $take, category: $category) {
      items {
        id
        question
        answer
        category
        slug
        viewCount
        helpfulCount
        isPublished
        sortOrder
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`

const GET_FAQ_CATEGORIES = gql`
  query GetFaqCategories {
    faqCategories
  }
`

const CREATE_FAQ = gql`
  mutation CreateFaq($input: CreateFaqInput!) {
    createFaq(input: $input) {
      id
      question
      answer
      category
      slug
      sortOrder
      isPublished
      createdAt
    }
  }
`

const UPDATE_FAQ = gql`
  mutation UpdateFaq($id: ID!, $input: UpdateFaqInput!) {
    updateFaq(id: $id, input: $input) {
      id
      question
      answer
      category
      slug
      sortOrder
      isPublished
      updatedAt
    }
  }
`

const DELETE_FAQ = gql`
  mutation DeleteFaq($id: ID!) {
    deleteFaq(id: $id) {
      success
    }
  }
`

interface FaqFormData {
  question: string
  answer: string
  category: string
  sortOrder: number
  isPublished: boolean
}

export default function FaqsPage() {
  const [page, setPage] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [formData, setFormData] = useState<FaqFormData>({
    question: '',
    answer: '',
    category: '',
    sortOrder: 0,
    isPublished: true,
  })

  const limit = 50
  const skip = page * limit

  const { data, loading, refetch } = useQuery(GET_FAQS, {
    variables: { skip, take: limit, category: selectedCategory || undefined },
    fetchPolicy: 'network-only',
  })

  const { data: categoriesData } = useQuery(GET_FAQ_CATEGORIES)

  const [createFaq, { loading: creating }] = useMutation(CREATE_FAQ, {
    onCompleted: () => {
      alert('FAQ 創建成功！')
      setShowCreateModal(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      alert(`創建失敗：${error.message}`)
    },
  })

  const [updateFaq, { loading: updating }] = useMutation(UPDATE_FAQ, {
    onCompleted: () => {
      alert('FAQ 更新成功！')
      setShowCreateModal(false)
      setEditingFaq(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`)
    },
  })

  const [deleteFaq] = useMutation(DELETE_FAQ, {
    onCompleted: () => {
      alert('FAQ 已刪除')
      refetch()
    },
    onError: (error) => {
      alert(`刪除失敗：${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      sortOrder: 0,
      isPublished: true,
    })
  }

  const handleCreate = () => {
    setEditingFaq(null)
    resetForm()
    setShowCreateModal(true)
  }

  const handleEdit = (faq: any) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      sortOrder: faq.sortOrder,
      isPublished: faq.isPublished,
    })
    setShowCreateModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('請填寫問題和答案')
      return
    }

    try {
      if (editingFaq) {
        await updateFaq({
          variables: {
            id: editingFaq.id,
            input: {
              question: formData.question,
              answer: formData.answer,
              category: formData.category || null,
              sortOrder: formData.sortOrder,
              isPublished: formData.isPublished,
            },
          },
        })
      } else {
        await createFaq({
          variables: {
            input: {
              question: formData.question,
              answer: formData.answer,
              category: formData.category || null,
              sortOrder: formData.sortOrder,
              isPublished: formData.isPublished,
            },
          },
        })
      }
    } catch (error) {
      console.error('提交失敗:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個 FAQ 嗎？')) return

    try {
      await deleteFaq({ variables: { id } })
    } catch (error) {
      console.error('刪除失敗:', error)
    }
  }

  const faqs = data?.allFaqs?.items || []
  const total = data?.allFaqs?.total || 0
  const hasMore = data?.allFaqs?.hasMore || false
  const categories = categoriesData?.faqCategories || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 頭部 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FAQ 管理</h1>
            <p className="text-gray-600 mt-2">管理常見問題</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            + 新增 FAQ
          </button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-600 text-sm">總計 FAQ</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-600 text-sm">分類數量</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-600 text-sm">已發布</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {faqs.filter((f: any) => f.isPublished).length}
            </p>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-semibold text-gray-700">篩選分類：</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(0)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">全部</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQ 列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">尚無 FAQ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-[40%] px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      問題
                    </th>
                    <th className="w-[12%] px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      分類
                    </th>
                    <th className="w-[8%] px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      排序
                    </th>
                    <th className="w-[10%] px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="w-[10%] px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      統計
                    </th>
                    <th className="w-[20%] px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {faqs.map((faq: any) => (
                    <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-full">
                          <p className="font-semibold text-gray-900 line-clamp-1 break-words">
                            {faq.question}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1 break-words">
                            {faq.answer.substring(0, 50)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {faq.category ? (
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full whitespace-nowrap">
                            {faq.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm whitespace-nowrap">無分類</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {faq.sortOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {faq.isPublished ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full whitespace-nowrap">
                            已發布
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full whitespace-nowrap">
                            草稿
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs text-gray-600 whitespace-nowrap">
                          <div>👁️ {faq.viewCount}</div>
                          <div>👍 {faq.helpfulCount}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(faq)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors whitespace-nowrap"
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
          {total > limit && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                顯示 {skip + 1} - {Math.min(skip + limit, total)} / 共 {total} 筆
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 創建/編輯 Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingFaq ? '編輯 FAQ' : '新增 FAQ'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    問題 *
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="輸入問題..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    答案 *
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="輸入答案..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    分類
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="例如：產品、訂購、配送、退換貨"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    排序順序
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="數字越小越前面"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <label htmlFor="isPublished" className="text-sm font-semibold text-gray-700">
                    發布到前台
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={creating || updating}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating || updating ? '處理中...' : editingFaq ? '更新' : '創建'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingFaq(null)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
