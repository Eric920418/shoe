'use client'

/**
 * 後台品牌管理頁面
 */

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { GET_BRANDS } from '@/graphql/queries'
import { CREATE_BRAND, UPDATE_BRAND, DELETE_BRAND } from '@/graphql/queries'

interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  website?: string
  country?: string
  productCount: number
  isActive: boolean
}

export default function BrandsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null)

  // 查詢品牌列表
  const { data, loading, error, refetch } = useQuery(GET_BRANDS)

  // GraphQL Mutations
  const [createBrand, { loading: creating }] = useMutation(CREATE_BRAND, {
    onCompleted: () => {
      toast.success('品牌新增成功')
      refetch()
      setIsEditing(false)
      setEditingBrand(null)
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`)
    },
  })

  const [updateBrand, { loading: updating }] = useMutation(UPDATE_BRAND, {
    onCompleted: () => {
      toast.success('品牌更新成功')
      refetch()
      setIsEditing(false)
      setEditingBrand(null)
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [deleteBrand, { loading: deleting }] = useMutation(DELETE_BRAND, {
    onCompleted: () => {
      toast.success('品牌刪除成功')
      refetch()
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  const brands = data?.brands || []

  // 新增品牌
  const handleAdd = () => {
    setEditingBrand({
      name: '',
      logo: '',
      website: '',
      country: '',
      isActive: true,
    })
    setIsEditing(true)
  }

  // 編輯品牌
  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setIsEditing(true)
  }

  // 保存品牌
  const handleSave = async () => {
    if (!editingBrand || !editingBrand.name) {
      toast.error('請填寫品牌名稱')
      return
    }

    try {
      if (editingBrand.id) {
        // 更新現有品牌
        await updateBrand({
          variables: {
            id: editingBrand.id,
            input: {
              name: editingBrand.name,
              slug: editingBrand.slug, // 選填，如果未提供則後端自動生成
              logo: editingBrand.logo || null,
              website: editingBrand.website || null,
              country: editingBrand.country || null,
              isActive: editingBrand.isActive,
            },
          },
        })
      } else {
        // 新增品牌
        await createBrand({
          variables: {
            input: {
              name: editingBrand.name,
              slug: editingBrand.slug, // 選填，如果未提供則後端自動生成
              logo: editingBrand.logo || null,
              website: editingBrand.website || null,
              country: editingBrand.country || null,
              sortOrder: 0,
            },
          },
        })
      }
    } catch (error) {
      // 錯誤已在 onError 中處理
      console.error('保存品牌時發生錯誤：', error)
    }
  }

  // 刪除品牌
  const handleDelete = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      toast.error(`無法刪除品牌「${name}」，因為還有 ${productCount} 個產品使用此品牌`)
      return
    }

    if (!confirm(`確定要刪除品牌「${name}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      await deleteBrand({
        variables: { id },
      })
    } catch (error) {
      // 錯誤已在 onError 中處理
      console.error('刪除品牌時發生錯誤：', error)
    }
  }

  // 更新編輯中的品牌欄位
  const updateEditingField = (field: keyof Brand, value: any) => {
    setEditingBrand((prev) => (prev ? { ...prev, [field]: value } : null))
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
          <h1 className="text-2xl font-bold text-gray-900">品牌管理</h1>
          <p className="text-gray-600 mt-1">管理產品品牌和標誌</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={isSaving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 新增品牌
        </button>
      </div>

      {/* 品牌網格 */}
      {brands.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">尚未建立任何品牌</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + 新增第一個品牌
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand: Brand) => (
          <div
            key={brand.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {brand.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      brand.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {brand.isActive ? '啟用' : '停用'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {brand.productCount} 個產品
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(brand.id, brand.name, brand.productCount)
                      }
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={brand.productCount > 0 || isSaving}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 編輯/新增對話框 */}
      {isEditing && editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBrand.id ? '編輯品牌' : '新增品牌'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  品牌名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBrand.name}
                  onChange={(e) => updateEditingField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例如：Nike"
                />
                <p className="text-xs text-gray-500 mt-1">
                  系統會自動生成 URL 網址（例如：/brands/nike）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={editingBrand.logo}
                  onChange={(e) => updateEditingField('logo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  狀態
                </label>
                <select
                  value={editingBrand.isActive ? 'true' : 'false'}
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
                  setEditingBrand(null)
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
