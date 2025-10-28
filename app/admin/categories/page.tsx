'use client'

/**
 * 後台分類管理頁面
 */

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { GET_CATEGORIES } from '@/graphql/queries'
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from '@/graphql/queries'

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  isActive: boolean
}

export default function CategoriesPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null)

  // 查詢分類列表
  const { data, loading, error, refetch } = useQuery(GET_CATEGORIES)

  // GraphQL Mutations
  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY, {
    onCompleted: () => {
      toast.success('分類新增成功')
      refetch()
      setIsEditing(false)
      setEditingCategory(null)
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`)
    },
  })

  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY, {
    onCompleted: () => {
      toast.success('分類更新成功')
      refetch()
      setIsEditing(false)
      setEditingCategory(null)
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [deleteCategory, { loading: deleting }] = useMutation(DELETE_CATEGORY, {
    onCompleted: () => {
      toast.success('分類刪除成功')
      refetch()
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  const categories = data?.categories || []

  // 新增分類
  const handleAdd = () => {
    setEditingCategory({
      name: '',
      isActive: true,
    })
    setIsEditing(true)
  }

  // 編輯分類
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsEditing(true)
  }

  // 保存分類
  const handleSave = async () => {
    if (!editingCategory || !editingCategory.name) {
      toast.error('請填寫分類名稱')
      return
    }

    try {
      if (editingCategory.id) {
        // 更新現有分類
        await updateCategory({
          variables: {
            id: editingCategory.id,
            input: {
              name: editingCategory.name,
              slug: editingCategory.slug, // 選填，如果未提供則後端自動生成
              isActive: editingCategory.isActive,
            },
          },
        })
      } else {
        // 新增分類
        await createCategory({
          variables: {
            input: {
              name: editingCategory.name,
              slug: editingCategory.slug, // 選填，如果未提供則後端自動生成
              sortOrder: 0,
            },
          },
        })
      }
    } catch (error) {
      // 錯誤已在 onError 中處理
      console.error('保存分類時發生錯誤：', error)
    }
  }

  // 刪除分類
  const handleDelete = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      toast.error(`無法刪除分類「${name}」，因為還有 ${productCount} 個產品使用此分類`)
      return
    }

    if (!confirm(`確定要刪除分類「${name}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      await deleteCategory({
        variables: { id },
      })
    } catch (error) {
      // 錯誤已在 onError 中處理
      console.error('刪除分類時發生錯誤：', error)
    }
  }

  // 更新編輯中的分類欄位
  const updateEditingField = (field: keyof Category, value: any) => {
    setEditingCategory((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  // Loading 和 Error 狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">❌ 載入失敗</div>
          <p className="text-gray-700 mb-4">錯誤訊息：{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  const isSaving = creating || updating || deleting

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分類管理</h1>
          <p className="text-gray-600 mt-1">管理產品分類和標籤</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={isSaving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 新增分類
        </button>
      </div>

      {/* 分類列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">尚未建立任何分類</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + 新增第一個分類
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  分類名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  產品數
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  狀態
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {category.productCount} 個
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      category.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category.isActive ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(category.id, category.name, category.productCount)
                      }
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={category.productCount > 0 || isSaving}
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 編輯/新增對話框 */}
      {isEditing && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory.id ? '編輯分類' : '新增分類'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分類名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => updateEditingField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例如：運動鞋"
                />
                <p className="text-xs text-gray-500 mt-1">
                  系統會自動生成 URL 網址（例如：/categories/運動鞋）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  狀態
                </label>
                <select
                  value={editingCategory.isActive ? 'true' : 'false'}
                  onChange={(e) => updateEditingField('isActive', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="true">啟用</option>
                  <option value="false">停用</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditingCategory(null)
                }}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
