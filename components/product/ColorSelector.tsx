'use client'

/**
 * 顏色選擇器组件
 */

interface ProductVariant {
  id: string
  name: string
  color?: string | null
  colorHex?: string | null
  colorImage?: string | null
  stock: number
  priceAdjustment: number
  isActive: boolean
}

interface ColorSelectorProps {
  variants: ProductVariant[]
  selectedVariant?: ProductVariant
  onVariantChange: (variant: ProductVariant) => void
}

export default function ColorSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: ColorSelectorProps) {
  // 只顯示有顏色資訊且 active 的變體
  const activeVariants = variants.filter((v) => v.isActive && v.color)

  if (activeVariants.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          選擇顏色
          {selectedVariant && (
            <span className="ml-2 text-primary-600 font-medium">
              {selectedVariant.color}
            </span>
          )}
        </h3>
        <span className="text-xs text-gray-500">
          {activeVariants.length} 种颜色可选
        </span>
      </div>

      {/* 颜色网格 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {activeVariants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id
          const isOutOfStock = variant.stock === 0

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onVariantChange(variant)}
              disabled={isOutOfStock}
              className={`
                relative group transition-all
                ${isOutOfStock ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
              title={variant.color || undefined}
            >
              {/* 颜色方块 */}
              <div
                className={`
                  w-full aspect-square rounded-lg border-2 transition-all
                  ${
                    isSelected
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }
                  ${isOutOfStock ? 'grayscale' : ''}
                `}
                style={{
                  backgroundColor: variant.colorHex || '#cccccc',
                }}
              >
                {/* 选中标记 */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* 售罄标记 */}
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
                    <span className="text-white text-xs font-semibold">
                      售罄
                    </span>
                  </div>
                )}
              </div>

              {/* 颜色名称 */}
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-700 block truncate">
                  {variant.color}
                </span>
                {variant.priceAdjustment !== 0 && (
                  <span className="text-xs text-primary-600 font-medium">
                    {variant.priceAdjustment > 0 ? '+' : ''}
                    ${Math.abs(Number(variant.priceAdjustment))}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* 選中顏色的詳細資訊 */}
      {selectedVariant && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-white shadow-md"
              style={{
                backgroundColor: selectedVariant.colorHex || '#cccccc',
              }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedVariant.color}
              </p>
              <p className="text-xs text-gray-600">
                {selectedVariant.stock > 0 ? (
                  <span className="text-green-600">庫存充足 ({selectedVariant.stock}件)</span>
                ) : (
                  <span className="text-red-600">已售罄</span>
                )}
              </p>
            </div>
          </div>
          {selectedVariant.priceAdjustment !== 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">價格調整</p>
              <p className="text-sm font-semibold text-primary-600">
                {selectedVariant.priceAdjustment > 0 ? '+' : ''}
                ${Math.abs(Number(selectedVariant.priceAdjustment))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
