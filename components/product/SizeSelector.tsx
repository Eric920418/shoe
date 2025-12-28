'use client'

/**
 * 尺碼選擇器组件 - 簡化版（無限庫存模式）
 * 直接顯示廠商提供的尺寸，不檢查庫存
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
}

export default function SizeSelector({
  sizeCharts,
  selectedSize,
  onSizeChange,
}: SizeSelectorProps) {
  // 按排序順序排列，只顯示啟用的尺寸
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

      {/* 尺碼網格 - 無庫存限制 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {sortedSizes.map((size) => {
          const isSelected = selectedSize === size.size

          return (
            <button
              key={size.id}
              onClick={() => onSizeChange(size)}
              className={`
                relative px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-primary-400'
                }
              `}
            >
              <span className="block">{size.size}</span>
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
