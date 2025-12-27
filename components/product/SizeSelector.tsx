'use client'

/**
 * 尺碼選擇器组件 - 簡化版
 * 直接顯示廠商提供的尺寸
 */

interface SizeChart {
  id: string
  size: string
  sortOrder: number
  isActive: boolean
}

interface SizeSelectorProps {
  sizeCharts: SizeChart[]
  selectedSize?: string
  onSizeChange: (size: SizeChart) => void
  // 從 SKU 獲取庫存資訊
  getStockForSize?: (sizeId: string) => number
}

export default function SizeSelector({
  sizeCharts,
  selectedSize,
  onSizeChange,
  getStockForSize,
}: SizeSelectorProps) {
  // 按排序順序排列
  const sortedSizes = [...sizeCharts]
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">選擇尺寸</h3>
        {selectedSize && (
          <span className="text-sm text-primary-600 font-medium">
            已選：{selectedSize}
          </span>
        )}
      </div>

      {/* 尺碼網格 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {sortedSizes.map((size) => {
          const isSelected = selectedSize === size.size
          const stock = getStockForSize ? getStockForSize(size.id) : -1  // -1 表示未知
          const isOutOfStock = stock === 0
          const isLowStock = stock > 0 && stock <= 5

          return (
            <button
              key={size.id}
              onClick={() => !isOutOfStock && onSizeChange(size)}
              disabled={isOutOfStock}
              className={`
                relative px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : isOutOfStock
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-primary-400'
                }
              `}
            >
              <span className="block">{size.size}</span>
              {isLowStock && !isOutOfStock && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500 text-white rounded">
                  剩{stock}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 無尺寸提示 */}
      {sortedSizes.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          此商品暫無可選尺寸
        </div>
      )}
    </div>
  )
}
