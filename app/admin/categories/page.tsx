'use client'

/**
 * 後台分類管理頁面
 * 按三大主分類（女鞋/男鞋&童鞋/其他）組織顯示
 */

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { GET_CATEGORIES } from '@/graphql/queries'
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from '@/graphql/queries'

// 主分類類型
type MainCategory = 'WOMEN' | 'MEN_KIDS' | 'OTHER'

// 主分類配置
const MAIN_CATEGORIES: { key: MainCategory; label: string; emoji: string; color: string; bgColor: string }[] = [
  { key: 'WOMEN', label: '女鞋', emoji: '👠', color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200' },
  { key: 'MEN_KIDS', label: '男鞋和童鞋', emoji: '👟', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  { key: 'OTHER', label: '其他', emoji: '📦', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
]

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  isActive: boolean
  mainCategory: MainCategory
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
    refetchQueries: [{ query: GET_CATEGORIES }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('分類刪除成功')
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  const categories: Category[] = data?.categories || []

  // 按主分類分組
  const categoriesByMain = MAIN_CATEGORIES.map(main => ({
    ...main,
    items: categories.filter(c => c.mainCategory === main.key)
  }))

  // 新增分類
  const handleAdd = (mainCategory: MainCategory) => {
    setEditingCategory({
      name: '',
      isActive: true,
      mainCategory,
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
              slug: editingCategory.slug,
              isActive: editingCategory.isActive,
              mainCategory: editingCategory.mainCategory,
            },
          },
        })
      } else {
        // 新增分類
        await createCategory({
          variables: {
            input: {
              name: editingCategory.name,
              slug: editingCategory.slug,
              sortOrder: 0,
              mainCategory: editingCategory.mainCategory,
            },
          },
        })
      }
    } catch (error) {
      console.error('保存分類時發生錯誤：', error)
    }
  }

  // 快速移動分類到其他主分類
  const handleMoveCategory = async (categoryId: string, newMainCategory: MainCategory) => {
    try {
      await updateCategory({
        variables: {
          id: categoryId,
          input: {
            mainCategory: newMainCategory,
          },
        },
      })
      toast.success('分類已移動')
    } catch (error) {
      console.error('移動分類時發生錯誤：', error)
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
          <div className="text-red-500 text-lg mb-4">載入失敗</div>
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
          <p className="text-gray-600 mt-1">管理三大主分類下的產品分類</p>
        </div>
      </div>

      {/* 說明卡片 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">分類結構說明</h3>
        <p className="text-sm text-blue-700">
          產品分類分為三大主分類：<strong>女鞋</strong>、<strong>男鞋和童鞋</strong>、<strong>其他</strong>。
          您可以在每個主分類下新增、編輯或移動子分類。點擊分類卡片上的「移動」按鈕可快速將分類移動到其他主分類。
        </p>
      </div>

      {/* 三大主分類看板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categoriesByMain.map((main) => (
          <div
            key={main.key}
            className={`rounded-xl border-2 ${main.bgColor} overflow-hidden`}
          >
            {/* 主分類標題 */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white/50">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${main.color} flex items-center gap-2`}>
                  <span className="text-2xl">{main.emoji}</span>
                  {main.label}
                  <span className="text-sm font-normal text-gray-500">
                    ({main.items.length} 個分類)
                  </span>
                </h2>
                <button
                  onClick={() => handleAdd(main.key)}
                  disabled={isSaving}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${main.color} bg-white hover:bg-gray-50 border border-current disabled:opacity-50`}
                >
                  + 新增
                </button>
              </div>
            </div>

            {/* 分類列表 */}
            <div className="p-3 space-y-2 min-h-[200px]">
              {main.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">尚無分類</p>
                  <button
                    onClick={() => handleAdd(main.key)}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    新增第一個分類
                  </button>
                </div>
              ) : (
                main.items.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          category.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {category.isActive ? '啟用' : '停用'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{category.productCount} 個產品</span>
                      <div className="flex items-center gap-1">
                        {/* 移動選單 */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleMoveCategory(category.id, e.target.value as MainCategory)
                            }
                          }}
                          disabled={isSaving}
                          className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 bg-white disabled:opacity-50"
                        >
                          <option value="">移動到...</option>
                          {MAIN_CATEGORIES.filter(m => m.key !== main.key).map(m => (
                            <option key={m.key} value={m.key}>
                              {m.emoji} {m.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEdit(category)}
                          disabled={isSaving}
                          className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded disabled:opacity-50"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name, category.productCount)}
                          disabled={category.productCount > 0 || isSaving}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={category.productCount > 0 ? '有產品使用此分類，無法刪除' : '刪除分類'}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 統計資訊 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">分類統計</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            <div className="text-sm text-gray-500">總分類數</div>
          </div>
          {categoriesByMain.map(main => (
            <div key={main.key} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${main.color}`}>{main.items.length}</div>
              <div className="text-sm text-gray-500">{main.label}</div>
            </div>
          ))}
        </div>
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
                  value={editingCategory.name || ''}
                  onChange={(e) => updateEditingField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例如：高跟鞋、運動鞋"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所屬主分類 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MAIN_CATEGORIES.map(main => (
                    <button
                      key={main.key}
                      type="button"
                      onClick={() => updateEditingField('mainCategory', main.key)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        editingCategory.mainCategory === main.key
                          ? `${main.bgColor} ${main.color} border-current`
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{main.emoji}</span>
                      {main.label}
                    </button>
                  ))}
                </div>
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
