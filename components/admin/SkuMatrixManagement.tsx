'use client'

/**
 * SKU 庫存矩陣管理組件
 * 以矩陣表格方式管理產品的「顏色 × 尺碼」庫存
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_SKU_MATRIX,
  GENERATE_SKUS,
  BATCH_UPDATE_SKU_STOCK,
} from '@/graphql/queries'
import toast from 'react-hot-toast'

interface ProductVariant {
  id: string
  name: string
  color: string
  colorHex: string
  isActive: boolean
  sortOrder: number
}

interface SizeChart {
  id: string
  eu: number
  us: string
  uk: string
  cm: number
  isActive: boolean
}

interface ProductSku {
  id: string
  productId: string
  variantId: string
  sizeChartId: string
  stock: number
  reservedStock: number
  isActive: boolean
}

interface SkuMatrix {
  productId: string
  productName: string
  variants: ProductVariant[]
  sizes: SizeChart[]
  skus: ProductSku[]
  totalStock: number
  totalVariants: number
  totalSizes: number
}

interface SkuMatrixManagementProps {
  productId: string
}

export default function SkuMatrixManagement({ productId }: SkuMatrixManagementProps) {
  // 追蹤修改的庫存值
  const [editedStocks, setEditedStocks] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // 查詢 SKU 矩陣數據
  const { data, loading, error, refetch } = useQuery(GET_SKU_MATRIX, {
    variables: { productId },
    fetchPolicy: 'network-only',
  })

  const matrix: SkuMatrix | null = data?.skuMatrix || null

  // 生成 SKU
  const [generateSkus, { loading: generating }] = useMutation(GENERATE_SKUS, {
    onCompleted: (result) => {
      const { created, skipped } = result.generateSkus
      if (created > 0) {
        toast.success(`已生成 ${created} 個 SKU 組合${skipped > 0 ? `（${skipped} 個已存在）` : ''}`)
      } else {
        toast.success(`所有 SKU 組合已存在（${skipped} 個）`)
      }
      refetch()
    },
    onError: (error) => {
      console.error('生成 SKU 失敗:', error)
      toast.error(`生成失敗：${error.message}`)
    },
  })

  // 批量更新庫存
  const [batchUpdate, { loading: updating }] = useMutation(BATCH_UPDATE_SKU_STOCK, {
    onCompleted: () => {
      toast.success('庫存已更新！')
      setEditedStocks({})
      setHasChanges(false)
      refetch()
    },
    onError: (error) => {
      console.error('更新庫存失敗:', error)
      toast.error(`更新失敗：${error.message}`)
    },
  })

  // 根據 variantId 和 sizeChartId 查找 SKU
  const findSku = useCallback(
    (variantId: string, sizeChartId: string): ProductSku | undefined => {
      return matrix?.skus.find(
        (sku) => sku.variantId === variantId && sku.sizeChartId === sizeChartId
      )
    },
    [matrix?.skus]
  )

  // 獲取 SKU 的顯示庫存（優先顯示編輯中的值）
  const getDisplayStock = (skuId: string, originalStock: number): number => {
    return editedStocks[skuId] ?? originalStock
  }

  // 處理庫存輸入變更
  const handleStockChange = (skuId: string, value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue) || numValue < 0) return

    setEditedStocks((prev) => ({
      ...prev,
      [skuId]: numValue,
    }))
    setHasChanges(true)
  }

  // 保存所有變更
  const handleSaveAll = async () => {
    if (!hasChanges || Object.keys(editedStocks).length === 0) return

    const updates = Object.entries(editedStocks).map(([skuId, stock]) => ({
      skuId,
      stock,
    }))

    try {
      await batchUpdate({
        variables: {
          productId,
          updates,
        },
      })
    } catch (error) {
      console.error('批量更新失敗:', error)
    }
  }

  // 重置所有變更
  const handleReset = () => {
    setEditedStocks({})
    setHasChanges(false)
  }

  // 生成所有 SKU 組合
  const handleGenerateSkus = async () => {
    try {
      await generateSkus({
        variables: { productId },
      })
    } catch (error) {
      console.error('生成 SKU 時發生錯誤:', error)
    }
  }

  // 計算統計數據
  const getStats = () => {
    if (!matrix) return { total: 0, outOfStock: 0, lowStock: 0 }

    const total = matrix.skus.reduce((sum, sku) => {
      const stock = editedStocks[sku.id] ?? sku.stock
      return sum + stock
    }, 0)

    const outOfStock = matrix.skus.filter((sku) => {
      const stock = editedStocks[sku.id] ?? sku.stock
      return stock === 0
    }).length

    const lowStock = matrix.skus.filter((sku) => {
      const stock = editedStocks[sku.id] ?? sku.stock
      return stock > 0 && stock <= 5
    }).length

    return { total, outOfStock, lowStock }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">載入庫存矩陣...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">載入失敗：{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          重試
        </button>
      </div>
    )
  }

  if (!matrix) {
    return (
      <div className="text-center py-8 text-gray-500">無法載入庫存數據</div>
    )
  }

  // 檢查是否有顏色和尺碼
  const hasVariants = matrix.variants.length > 0
  const hasSizes = matrix.sizes.length > 0

  if (!hasVariants || !hasSizes) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-yellow-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            無法管理庫存
          </h3>
          <p className="text-yellow-700 mb-4">
            請先完成以下設定才能管理庫存：
          </p>
          <ul className="text-yellow-700 text-sm space-y-1">
            {!hasVariants && <li>• 新增至少一個顏色（在「顏色管理」分頁）</li>}
            {!hasSizes && <li>• 新增至少一個尺碼（在「尺碼管理」分頁）</li>}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 操作按鈕 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerateSkus}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? '生成中...' : '自動生成 SKU 組合'}
        </button>

        {hasChanges && (
          <>
            <button
              onClick={handleSaveAll}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? '保存中...' : `保存變更 (${Object.keys(editedStocks).length})`}
            </button>
            <button
              onClick={handleReset}
              disabled={updating}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消變更
            </button>
          </>
        )}

        <button
          onClick={() => refetch()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          重新整理
        </button>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">總 SKU 數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{matrix.skus.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">總庫存</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total} 件</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">缺貨組合</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">低庫存組合</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStock}</p>
        </div>
      </div>

      {/* 庫存矩陣表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            庫存矩陣（{matrix.variants.length} 顏色 × {matrix.sizes.length} 尺碼）
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            直接在表格中編輯庫存數量，完成後點擊「保存變更」
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-r border-gray-200">
                  顏色 / 尺碼
                </th>
                {matrix.sizes.map((size) => (
                  <th
                    key={size.id}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 min-w-[80px]"
                  >
                    <div>EU {size.eu}</div>
                    <div className="text-[10px] text-gray-400 font-normal">
                      US {size.us}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase border-b border-l border-gray-200 bg-gray-100">
                  小計
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.variants.map((variant) => {
                // 計算該顏色的庫存小計
                const variantTotal = matrix.sizes.reduce((sum, size) => {
                  const sku = findSku(variant.id, size.id)
                  if (!sku) return sum
                  const stock = editedStocks[sku.id] ?? sku.stock
                  return sum + stock
                }, 0)

                return (
                  <tr
                    key={variant.id}
                    className="hover:bg-gray-50 border-b border-gray-200"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <span className="font-medium text-gray-900">
                          {variant.color}
                        </span>
                      </div>
                    </td>
                    {matrix.sizes.map((size) => {
                      const sku = findSku(variant.id, size.id)

                      if (!sku) {
                        // SKU 不存在
                        return (
                          <td
                            key={size.id}
                            className="px-3 py-2 text-center border-gray-200"
                          >
                            <span className="text-gray-300">-</span>
                          </td>
                        )
                      }

                      const currentStock = getDisplayStock(sku.id, sku.stock)
                      const isEdited = editedStocks[sku.id] !== undefined
                      const isOutOfStock = currentStock === 0
                      const isLowStock = currentStock > 0 && currentStock <= 5

                      return (
                        <td
                          key={size.id}
                          className="px-2 py-2 text-center border-gray-200"
                        >
                          <input
                            type="number"
                            value={currentStock}
                            onChange={(e) => handleStockChange(sku.id, e.target.value)}
                            min="0"
                            className={`w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              isEdited
                                ? 'border-blue-500 bg-blue-50'
                                : isOutOfStock
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : isLowStock
                                ? 'border-orange-300 bg-orange-50 text-orange-700'
                                : 'border-gray-300'
                            }`}
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-200 bg-gray-50">
                      {variantTotal}
                    </td>
                  </tr>
                )
              })}
              {/* 尺碼小計行 */}
              <tr className="bg-gray-100">
                <td className="sticky left-0 z-10 bg-gray-100 px-4 py-3 border-r border-t border-gray-200 font-semibold text-gray-700">
                  小計
                </td>
                {matrix.sizes.map((size) => {
                  const sizeTotal = matrix.variants.reduce((sum, variant) => {
                    const sku = findSku(variant.id, size.id)
                    if (!sku) return sum
                    const stock = editedStocks[sku.id] ?? sku.stock
                    return sum + stock
                  }, 0)

                  return (
                    <td
                      key={size.id}
                      className="px-3 py-3 text-center font-semibold text-gray-700 border-t border-gray-200"
                    >
                      {sizeTotal}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-center font-bold text-blue-600 border-l border-t border-gray-200">
                  {stats.total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 圖例說明 */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">圖例說明</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 border border-gray-300 rounded"></div>
            <span className="text-gray-600">正常庫存</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 border border-orange-300 bg-orange-50 rounded"></div>
            <span className="text-gray-600">低庫存 (≤5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 border border-red-300 bg-red-50 rounded"></div>
            <span className="text-gray-600">缺貨 (0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 border border-blue-500 bg-blue-50 rounded"></div>
            <span className="text-gray-600">已修改（未保存）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">-</span>
            <span className="text-gray-600">未生成 SKU</span>
          </div>
        </div>
      </div>
    </div>
  )
}
