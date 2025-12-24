'use client'

/**
 * 顏色管理組件 - 管理產品的顏色變體
 */

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import Image from 'next/image'
import {
  GET_PRODUCT_VARIANTS,
  CREATE_PRODUCT_VARIANT,
  UPDATE_PRODUCT_VARIANT,
  DELETE_PRODUCT_VARIANT,
} from '@/graphql/queries'
import toast from 'react-hot-toast'

interface ProductVariant {
  id: string
  productId: string
  name: string
  color: string
  colorHex: string
  colorImage?: string | null
  priceAdjustment: number
  stock: number
  images: any[]
  isActive: boolean
  isDefault: boolean
  sortOrder: number
}

interface ColorManagementProps {
  productId: string
}

// 預設顏色選項
const defaultColors = [
  { name: '黑色', color: '黑色', colorHex: '#000000' },
  { name: '白色', color: '白色', colorHex: '#FFFFFF' },
  { name: '灰色', color: '灰色', colorHex: '#808080' },
  { name: '紅色', color: '紅色', colorHex: '#FF0000' },
  { name: '藍色', color: '藍色', colorHex: '#0066CC' },
  { name: '綠色', color: '綠色', colorHex: '#008000' },
  { name: '咖啡色', color: '咖啡色', colorHex: '#8B4513' },
  { name: '米色', color: '米色', colorHex: '#F5F5DC' },
  { name: '粉色', color: '粉色', colorHex: '#FFC0CB' },
  { name: '橘色', color: '橘色', colorHex: '#FFA500' },
]

export default function ColorManagement({ productId }: ColorManagementProps) {
  const [editingVariant, setEditingVariant] = useState<Partial<ProductVariant> | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // 上傳顏色圖片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上傳失敗')
      }

      const data = await response.json()
      updateEditingField('colorImage', data.url)
      toast.success('圖片上傳成功！')
    } catch (error: any) {
      console.error('圖片上傳失敗:', error)
      toast.error(error.message || '圖片上傳失敗，請重試')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // 移除顏色圖片
  const handleRemoveImage = () => {
    updateEditingField('colorImage', null)
    toast.success('圖片已移除')
  }

  // 查詢顏色變體數據
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_VARIANTS, {
    variables: { productId },
    fetchPolicy: 'network-only',
  })

  const variants: ProductVariant[] = data?.productVariants || []

  // 創建顏色變體
  const [createVariant, { loading: creating }] = useMutation(CREATE_PRODUCT_VARIANT, {
    onCompleted: () => {
      toast.success('顏色新增成功！')
      setEditingVariant(null)
      refetch()
    },
    onError: (error) => {
      console.error('創建顏色失敗:', error)
      toast.error(`新增失敗：${error.message}`)
    },
  })

  // 更新顏色變體
  const [updateVariant, { loading: updating }] = useMutation(UPDATE_PRODUCT_VARIANT, {
    onCompleted: () => {
      toast.success('顏色更新成功！')
      setEditingVariant(null)
      refetch()
    },
    onError: (error) => {
      console.error('更新顏色失敗:', error)
      toast.error(`更新失敗：${error.message}`)
    },
  })

  // 刪除顏色變體
  const [deleteVariant] = useMutation(DELETE_PRODUCT_VARIANT, {
    onCompleted: () => {
      toast.success('顏色刪除成功！')
      refetch()
    },
    onError: (error) => {
      console.error('刪除顏色失敗:', error)
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  // 打開編輯表單
  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setTimeout(() => {
      document.getElementById('color-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // 打開新增表單
  const handleAdd = () => {
    setEditingVariant({
      productId,
      name: '',
      color: '',
      colorHex: '#000000',
      colorImage: null,
      priceAdjustment: 0,
      stock: 0,
      images: [],
      isActive: true,
      isDefault: false,
    })
    setTimeout(() => {
      document.getElementById('color-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // 快速新增預設顏色
  const handleQuickAdd = async (colorOption: typeof defaultColors[0]) => {
    // 檢查是否已存在
    const exists = variants.some(v => v.color === colorOption.color)
    if (exists) {
      toast.error(`顏色「${colorOption.color}」已存在！`)
      return
    }

    try {
      await createVariant({
        variables: {
          input: {
            productId,
            name: colorOption.name,
            color: colorOption.color,
            colorHex: colorOption.colorHex,
            priceAdjustment: 0,
            stock: 0,
            isActive: true,
            isDefault: variants.length === 0, // 第一個顏色設為預設
          },
        },
      })
    } catch (error) {
      console.error('快速新增顏色時發生錯誤:', error)
    }
  }

  // 保存顏色變體
  const handleSave = async () => {
    if (!editingVariant) return

    // 驗證必填欄位
    if (!editingVariant.name?.trim()) {
      toast.error('請填寫顏色名稱')
      return
    }

    if (!editingVariant.color?.trim()) {
      toast.error('請填寫顏色')
      return
    }

    if (!editingVariant.colorHex || !/^#[0-9A-Fa-f]{6}$/.test(editingVariant.colorHex)) {
      toast.error('請選擇有效的顏色代碼')
      return
    }

    try {
      if (editingVariant.id) {
        // 更新現有顏色
        await updateVariant({
          variables: {
            id: editingVariant.id,
            input: {
              name: editingVariant.name.trim(),
              color: editingVariant.color.trim(),
              colorHex: editingVariant.colorHex,
              colorImage: editingVariant.colorImage || null,
              priceAdjustment: Number(editingVariant.priceAdjustment) || 0,
              stock: Number(editingVariant.stock) || 0,
              isActive: editingVariant.isActive ?? true,
              isDefault: editingVariant.isDefault ?? false,
            },
          },
        })
      } else {
        // 新增顏色
        await createVariant({
          variables: {
            input: {
              productId,
              name: editingVariant.name.trim(),
              color: editingVariant.color.trim(),
              colorHex: editingVariant.colorHex,
              colorImage: editingVariant.colorImage || null,
              priceAdjustment: Number(editingVariant.priceAdjustment) || 0,
              stock: Number(editingVariant.stock) || 0,
              isActive: editingVariant.isActive ?? true,
              isDefault: editingVariant.isDefault ?? false,
            },
          },
        })
      }
    } catch (error) {
      console.error('保存顏色時發生錯誤:', error)
    }
  }

  // 刪除顏色變體
  const handleDelete = async (id: string, colorName: string) => {
    if (!confirm(`確定要刪除顏色「${colorName}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      await deleteVariant({
        variables: { id },
      })
    } catch (error) {
      console.error('刪除顏色時發生錯誤:', error)
    }
  }

  // 更新編輯中的顏色欄位
  const updateEditingField = (field: keyof ProductVariant, value: any) => {
    setEditingVariant((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">載入顏色中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">載入顏色失敗：{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 操作按鈕 */}
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 新增顏色
        </button>
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showQuickAdd ? '關閉快速新增' : '快速新增常用顏色'}
        </button>
      </div>

      {/* 快速新增區域 */}
      {showQuickAdd && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速新增常用顏色</h3>
          <p className="text-sm text-gray-600 mb-4">點擊下方顏色即可快速新增到產品中</p>
          <div className="flex flex-wrap gap-3">
            {defaultColors.map((colorOption) => {
              const exists = variants.some(v => v.color === colorOption.color)
              return (
                <button
                  key={colorOption.color}
                  onClick={() => handleQuickAdd(colorOption)}
                  disabled={creating || exists}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                    exists
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:border-primary-500 hover:shadow-md'
                  }`}
                  title={exists ? '已存在' : `新增 ${colorOption.color}`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: colorOption.colorHex }}
                  />
                  <span className={exists ? 'line-through' : ''}>{colorOption.color}</span>
                  {exists && <span className="text-xs">(已存在)</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 顏色列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">顏色</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">圖片</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">名稱</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">色碼</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">價格調整</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">狀態</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">預設</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暫無顏色數據，請新增顏色讓客戶選擇
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr
                    key={variant.id}
                    className={`hover:bg-gray-50 ${editingVariant?.id === variant.id ? 'bg-primary-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: variant.colorHex }}
                        title={variant.colorHex}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {variant.colorImage ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          {/* 相對路徑用 img，絕對 URL（含 R2）用 Next.js Image 優化 */}
                          {variant.colorImage.startsWith('/') && !variant.colorImage.startsWith('//') ? (
                            <img
                              src={variant.colorImage}
                              alt={variant.color}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image
                              src={variant.colorImage}
                              alt={variant.color}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">無圖片</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{variant.color}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-sm">{variant.colorHex}</td>
                    <td className="px-4 py-3">
                      {variant.priceAdjustment !== 0 && (
                        <span className={variant.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                          {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment}
                        </span>
                      )}
                      {variant.priceAdjustment === 0 && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          variant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {variant.isActive ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {variant.isDefault && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                          預設
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(variant.id, variant.color)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">總顏色數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{variants.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">啟用顏色</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {variants.filter((v) => v.isActive).length}
          </p>
        </div>
      </div>

      {/* 庫存管理提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">庫存在「庫存管理」統一管理</p>
            <p className="text-xs text-blue-700 mt-1">每個「顏色 × 尺碼」組合有獨立庫存，請切換到「庫存管理」標籤頁進行設定</p>
          </div>
        </div>
      </div>

      {/* 編輯/新增表單 */}
      {editingVariant && (
        <div id="color-form" className="bg-white rounded-lg shadow-lg border-2 border-primary-500 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingVariant.id ? `編輯顏色「${editingVariant.color}」` : '新增顏色'}
            </h3>
            <button
              onClick={() => setEditingVariant(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                顏色名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingVariant.name || ''}
                onChange={(e) => updateEditingField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如: 經典黑"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                顏色 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingVariant.color || ''}
                onChange={(e) => updateEditingField('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如: 黑色"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                顏色代碼 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={editingVariant.colorHex || '#000000'}
                  onChange={(e) => updateEditingField('colorHex', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={editingVariant.colorHex || ''}
                  onChange={(e) => updateEditingField('colorHex', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">價格調整</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={editingVariant.priceAdjustment || 0}
                  onChange={(e) => updateEditingField('priceAdjustment', Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">正數為加價，負數為減價</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select
                value={editingVariant.isActive ? 'true' : 'false'}
                onChange={(e) => updateEditingField('isActive', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="true">啟用</option>
                <option value="false">停用</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">設為預設顏色</label>
              <select
                value={editingVariant.isDefault ? 'true' : 'false'}
                onChange={(e) => updateEditingField('isDefault', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">預設顏色會在產品頁面自動選中</p>
            </div>
          </div>

          {/* 顏色圖片上傳 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              顏色展示圖片
            </label>
            <p className="text-xs text-gray-500 mb-3">
              上傳此顏色對應的產品圖片，將在前台顏色選擇器中顯示給買家
            </p>

            <div className="flex items-start gap-4">
              {/* 圖片預覽 */}
              {editingVariant.colorImage ? (
                <div className="relative group">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                    {/* 相對路徑用 img，絕對 URL（含 R2）用 Next.js Image 優化 */}
                    {editingVariant.colorImage.startsWith('/') && !editingVariant.colorImage.startsWith('//') ? (
                      <img
                        src={editingVariant.colorImage}
                        alt="顏色圖片"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={editingVariant.colorImage}
                        alt="顏色圖片"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                    title="移除圖片"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* 上傳按鈕 */}
              <div className="flex-1">
                <label className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {uploadingImage ? '上傳中...' : editingVariant.colorImage ? '更換圖片' : '選擇圖片'}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">支援 JPG、PNG、WebP，建議尺寸 400x400 像素</p>
              </div>
            </div>
          </div>

          {/* 儲存按鈕區域 */}
          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => setEditingVariant(null)}
              disabled={creating || updating}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={creating || updating}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating || updating ? '保存中...' : '儲存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
