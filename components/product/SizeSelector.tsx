'use client'

/**
 * 尺碼選擇器组件 - 鞋店核心组件
 */

import { useState } from 'react'

interface SizeChart {
  id: string
  eu: string
  us: string
  uk: string
  cm: string
  footLength: number
  footWidth?: string | null
  stock: number
  isActive: boolean
}

interface SizeSelectorProps {
  sizeCharts: SizeChart[]
  selectedSize?: string
  onSizeChange: (size: SizeChart) => void
  variantId?: string
}

export default function SizeSelector({
  sizeCharts,
  selectedSize,
  onSizeChange,
}: SizeSelectorProps) {
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [sizeSystem, setSizeSystem] = useState<'EU' | 'US' | 'UK' | 'CM'>('EU')

  // 按EU码排序
  const sortedSizes = [...sizeCharts].sort((a, b) => {
    return parseFloat(a.eu) - parseFloat(b.eu)
  })

  const getSizeLabel = (size: SizeChart) => {
    switch (sizeSystem) {
      case 'EU':
        return size.eu
      case 'US':
        return size.us
      case 'UK':
        return size.uk
      case 'CM':
        return size.cm
      default:
        return size.eu
    }
  }

  return (
    <div className="space-y-4">
      {/* 尺碼系統切换 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">選擇尺碼</h3>
        <div className="flex gap-2">
          {(['EU', 'US', 'UK', 'CM'] as const).map((system) => (
            <button
              key={system}
              onClick={() => setSizeSystem(system)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                sizeSystem === system
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {system}
            </button>
          ))}
        </div>
      </div>

      {/* 尺码网格 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {sortedSizes.map((size) => {
          const isSelected = selectedSize === size.eu
          const isOutOfStock = size.stock === 0
          const isLowStock = size.stock > 0 && size.stock <= 5

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
              <span className="block">{getSizeLabel(size)}</span>
              {isLowStock && !isOutOfStock && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500 text-white rounded">
                  剩{size.stock}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 選中的尺碼資訊 */}
      {selectedSize && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-blue-900">已选尺码：</span>
            {sortedSizes
              .filter((s) => s.eu === selectedSize)
              .map((s) => (
                <span key={s.id} className="text-blue-700">
                  EU {s.eu} / US {s.us} / UK {s.uk} / {s.cm}cm
                  {s.footWidth && ` (${s.footWidth})`}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* 尺码对照表按钮 */}
      <button
        onClick={() => setShowSizeGuide(!showSizeGuide)}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
      >
        {showSizeGuide ? '隐藏' : '查看'}尺码对照表
      </button>

      {/* 尺码对照表 */}
      {showSizeGuide && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    欧码 (EU)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    美码 (US)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    英码 (UK)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    厘米 (CM)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    脚长
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    庫存
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSizes.map((size) => (
                  <tr
                    key={size.id}
                    className={size.stock === 0 ? 'bg-gray-50 text-gray-400' : ''}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{size.eu}</td>
                    <td className="px-4 py-3 text-sm">{size.us}</td>
                    <td className="px-4 py-3 text-sm">{size.uk}</td>
                    <td className="px-4 py-3 text-sm">{size.cm}</td>
                    <td className="px-4 py-3 text-sm">{size.footLength}cm</td>
                    <td className="px-4 py-3 text-sm">
                      {size.stock === 0 ? (
                        <span className="text-red-600 font-semibold">售罄</span>
                      ) : size.stock <= 5 ? (
                        <span className="text-orange-600 font-semibold">
                          剩{size.stock}件
                        </span>
                      ) : (
                        <span className="text-green-600">{size.stock}件</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 尺码建议 */}
          <div className="bg-blue-50 p-4 text-sm text-gray-700">
            <h4 className="font-semibold mb-2 text-blue-900">📏 如何選擇合適的尺碼？</h4>
            <ul className="space-y-1 text-xs">
              <li>• 测量脚长：赤脚站立，测量脚后跟到最长脚趾的距离</li>
              <li>• 對照表格：根據腳長選擇對應的尺碼</li>
              <li>• 脚宽考虑：如果脚较宽，建议选大半码</li>
              <li>• 穿袜厚度：冬季穿厚袜建议选大半码</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
