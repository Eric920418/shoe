'use client'

/**
 * 尺碼管理組件
 * 提供 10-50 號的預設尺寸表格，點選即可新增
 */

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_PRODUCT_SIZE_CHARTS,
  CREATE_SIZE_CHART,
  UPDATE_SIZE_CHART,
  DELETE_SIZE_CHART,
} from '@/graphql/queries'
import toast from 'react-hot-toast'

interface SizeChart {
  id: string
  productId: string
  size: string
  sortOrder: number
  isActive: boolean
}

interface SizeManagementProps {
  productId: string
}

// 預設尺寸範圍：10 到 50 號
const DEFAULT_SIZES = Array.from({ length: 41 }, (_, i) => String(10 + i))

export default function SizeManagement({ productId }: SizeManagementProps) {
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())
  const [editingSize, setEditingSize] = useState<Partial<SizeChart> | null>(null)

  // 查詢尺碼數據
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_SIZE_CHARTS, {
    variables: { productId },
    fetchPolicy: 'network-only',
  })

  const sizeCharts: SizeChart[] = data?.productSizeChart || []
  const existingSizes = new Set(sizeCharts.map(s => s.size))

  // 創建尺碼
  const [createSizeChart, { loading: creating }] = useMutation(CREATE_SIZE_CHART, {
    onError: (error) => {
      console.error('創建尺碼失敗:', error)
      toast.error(`新增失敗：${error.message}`)
    },
  })

  // 更新尺碼
  const [updateSizeChart, { loading: updating }] = useMutation(UPDATE_SIZE_CHART, {
    onCompleted: () => {
      toast.success('尺碼更新成功！')
      setEditingSize(null)
      refetch()
    },
    onError: (error) => {
      console.error('更新尺碼失敗:', error)
      toast.error(`更新失敗：${error.message}`)
    },
  })

  // 刪除尺碼
  const [deleteSizeChart] = useMutation(DELETE_SIZE_CHART, {
    onCompleted: () => {
      toast.success('尺碼刪除成功！')
      refetch()
    },
    onError: (error) => {
      console.error('刪除尺碼失敗:', error)
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  // 切換選擇尺寸
  const toggleSize = (size: string) => {
    // 如果已存在於產品中，不能選擇
    if (existingSizes.has(size)) return

    const newSelected = new Set(selectedSizes)
    if (newSelected.has(size)) {
      newSelected.delete(size)
    } else {
      newSelected.add(size)
    }
    setSelectedSizes(newSelected)
  }

  // 批量新增選中的尺寸
  const handleAddSelected = async () => {
    if (selectedSizes.size === 0) {
      toast.error('請先選擇要新增的尺寸')
      return
    }

    try {
      toast.loading(`正在新增 ${selectedSizes.size} 個尺寸...`, { id: 'adding-sizes' })

      const sizesArray = Array.from(selectedSizes).sort((a, b) => Number(a) - Number(b))
      let sortOrder = (sizeCharts.length + 1) * 10

      for (const size of sizesArray) {
        await createSizeChart({
          variables: {
            input: {
              productId,
              size,
              sortOrder,
            },
          },
        })
        sortOrder += 10
      }

      toast.success(`已新增 ${selectedSizes.size} 個尺寸！`, { id: 'adding-sizes' })
      setSelectedSizes(new Set())
      refetch()
    } catch (error) {
      console.error('批量新增失敗:', error)
      toast.error('部分尺寸新增失敗', { id: 'adding-sizes' })
    }
  }

  // 快速選擇範圍
  const selectRange = (start: number, end: number) => {
    const newSelected = new Set(selectedSizes)
    for (let i = start; i <= end; i++) {
      const size = String(i)
      if (!existingSizes.has(size)) {
        newSelected.add(size)
      }
    }
    setSelectedSizes(newSelected)
  }

  // 清除選擇
  const clearSelection = () => {
    setSelectedSizes(new Set())
  }

  // 全選（未新增的）
  const selectAll = () => {
    const newSelected = new Set<string>()
    DEFAULT_SIZES.forEach(size => {
      if (!existingSizes.has(size)) {
        newSelected.add(size)
      }
    })
    setSelectedSizes(newSelected)
  }

  // 刪除尺碼
  const handleDelete = async (id: string, size: string) => {
    if (!confirm(`確定要刪除尺寸 "${size}" 嗎？`)) {
      return
    }

    try {
      await deleteSizeChart({
        variables: { id },
      })
    } catch (error) {
      console.error('刪除尺碼時發生錯誤:', error)
    }
  }

  // 更新編輯中的欄位
  const updateEditingField = (field: keyof SizeChart, value: any) => {
    setEditingSize((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  // 保存編輯
  const handleSaveEdit = async () => {
    if (!editingSize?.id) return

    try {
      await updateSizeChart({
        variables: {
          id: editingSize.id,
          input: {
            size: editingSize.size,
            sortOrder: editingSize.sortOrder,
            isActive: editingSize.isActive ?? true,
          },
        },
      })
    } catch (error) {
      console.error('保存失敗:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">載入尺碼中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">載入尺碼失敗：{error.message}</p>
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
      {/* 預設尺寸選擇表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">點選新增尺寸</h3>
            <p className="text-sm text-gray-500 mt-1">
              點選要新增的尺寸，已新增的尺寸會顯示為綠色
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              清除選擇
            </button>
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              全選
            </button>
          </div>
        </div>

        {/* 快速範圍選擇 */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
          <span className="text-sm text-gray-600 mr-2">快速選擇：</span>
          <button
            onClick={() => selectRange(35, 40)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            35-40 號
          </button>
          <button
            onClick={() => selectRange(36, 42)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            36-42 號
          </button>
          <button
            onClick={() => selectRange(38, 44)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            38-44 號
          </button>
          <button
            onClick={() => selectRange(39, 46)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            39-46 號
          </button>
        </div>

        {/* 尺寸格子 */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
          {DEFAULT_SIZES.map((size) => {
            const isExisting = existingSizes.has(size)
            const isSelected = selectedSizes.has(size)

            return (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                disabled={isExisting}
                className={`
                  aspect-square flex items-center justify-center text-sm font-medium rounded-lg border-2 transition-all
                  ${
                    isExisting
                      ? 'bg-green-100 border-green-400 text-green-700 cursor-default'
                      : isSelected
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
              >
                {size}
              </button>
            )
          })}
        </div>

        {/* 圖例說明 */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-green-100 border-2 border-green-400"></span>
            <span className="text-gray-600">已新增</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600"></span>
            <span className="text-gray-600">已選擇（待新增）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-white border-2 border-gray-300"></span>
            <span className="text-gray-600">可選擇</span>
          </div>
        </div>

        {/* 新增按鈕 */}
        {selectedSizes.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                已選擇 <span className="font-bold text-blue-600">{selectedSizes.size}</span> 個尺寸：
                <span className="ml-2 text-gray-900">
                  {Array.from(selectedSizes).sort((a, b) => Number(a) - Number(b)).join(', ')}
                </span>
              </div>
              <button
                onClick={handleAddSelected}
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {creating ? '新增中...' : `新增 ${selectedSizes.size} 個尺寸`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 已新增的尺碼列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">已新增的尺寸</h3>
          <p className="text-sm text-gray-500 mt-1">共 {sizeCharts.length} 個尺寸</p>
        </div>

        {sizeCharts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            尚未新增任何尺寸，請在上方點選要新增的尺寸
          </div>
        ) : (
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {sizeCharts
                .sort((a, b) => Number(a.size) - Number(b.size))
                .map((size) => (
                  <div
                    key={size.id}
                    className={`
                      group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                      ${size.isActive
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    <span className="text-lg font-bold">{size.size}</span>
                    <button
                      onClick={() => setEditingSize(size)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                      title="編輯"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(size.id, size.size)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      title="刪除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 庫存管理提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">庫存在「庫存管理」統一管理</p>
            <p className="text-xs text-blue-700 mt-1">每個「顏色 × 尺寸」組合有獨立庫存，請切換到「庫存管理」標籤頁進行設定</p>
          </div>
        </div>
      </div>

      {/* 編輯對話框 */}
      {editingSize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                編輯尺寸：{editingSize.size}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">尺寸</label>
                <input
                  type="text"
                  value={editingSize.size || ''}
                  onChange={(e) => updateEditingField('size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序順序</label>
                <input
                  type="number"
                  value={editingSize.sortOrder || 0}
                  onChange={(e) => updateEditingField('sortOrder', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={editingSize.isActive ? 'true' : 'false'}
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
                onClick={() => setEditingSize(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {updating ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
