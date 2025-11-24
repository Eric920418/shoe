'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'

// GraphQL 查詢
const ANALYZE_CART_BATCHING = gql`
  query AnalyzeCartForBatching {
    analyzeCartForBatching {
      totalItems
      totalVolume
      requiresBatching
      canCombinePackaging
      batches {
        batchNumber
        items {
          id
          product {
            name
            packagingVolume
          }
          quantity
        }
        totalQuantity
        totalVolume
        estimatedBoxCount
        canShipTogether
        shippingFee
        notes
      }
      suggestedPackagingOption
      estimatedShippingFee
      warnings
      suggestions
    }
  }
`

const OPTIMIZE_CART_BATCHING = gql`
  mutation OptimizeCartBatching {
    optimizeCartBatching {
      id
      items {
        id
        suggestedBatch
      }
    }
  }
`

interface CartBatchingSuggestionProps {
  isAuthenticated: boolean
  onBatchingOptimized?: () => void
}

export default function CartBatchingSuggestion({
  isAuthenticated,
  onBatchingOptimized
}: CartBatchingSuggestionProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false)

  // 只有已登入用戶才執行分析
  const { data, loading, error, refetch } = useQuery(ANALYZE_CART_BATCHING, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [optimizeBatching, { loading: optimizing }] = useMutation(OPTIMIZE_CART_BATCHING, {
    onCompleted: () => {
      setAcceptedSuggestion(true)
      if (onBatchingOptimized) {
        onBatchingOptimized()
      }
      refetch()
    },
    onError: (error) => {
      console.error('優化分批失敗:', error)
      alert('優化分批失敗，請重試')
    },
  })

  // 如果不是登入用戶或還在載入，不顯示
  if (!isAuthenticated || loading) return null
  if (error) {
    console.error('分析購物車失敗:', error)
    return null
  }

  const analysis = data?.analyzeCartForBatching
  if (!analysis || analysis.totalItems === 0) return null

  const {
    requiresBatching,
    canCombinePackaging,
    batches,
    suggestedPackagingOption,
    estimatedShippingFee,
    warnings,
    suggestions
  } = analysis

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* 標題區 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          智能配送建議
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {showDetails ? '隱藏詳情' : '查看詳情'}
        </button>
      </div>

      {/* 警告訊息 */}
      {warnings.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">注意事項</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 建議訊息 */}
      {suggestions.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">配送建議</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 分批詳情 */}
      {showDetails && batches.length > 0 && (
        <div className="mt-4 space-y-4">
          <h4 className="font-medium text-gray-900">分批詳情</h4>
          {batches.map((batch: any) => (
            <div key={batch.batchNumber} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  第 {batch.batchNumber} 批
                </span>
                <span className="text-sm text-gray-600">
                  運費：NT$ {batch.shippingFee}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <div>商品數量：{batch.totalQuantity} 雙</div>
                <div>預估包裝盒：{batch.estimatedBoxCount} 個</div>
                {!batch.canShipTogether && (
                  <div className="text-red-600 mt-1">超過7-11取貨限制</div>
                )}
              </div>

              {batch.items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">包含商品：</div>
                  {batch.items.map((item: any) => (
                    <div key={item.id} className="text-sm text-gray-600 mt-1">
                      • {item.product.name} x {item.quantity}
                    </div>
                  ))}
                </div>
              )}

              {batch.notes.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {batch.notes.map((note: string, index: number) => (
                    <div key={index}>• {note}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 包裝選項 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">包裝選項</h4>
        <div className="space-y-2">
          {canCombinePackaging && (
            <label className="flex items-start">
              <input
                type="radio"
                name="packaging"
                value="COMBINED"
                defaultChecked={suggestedPackagingOption === 'COMBINED'}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-700">合併包裝</div>
                <div className="text-sm text-gray-500">
                  多雙鞋子裝在同一個盒子，減少包裝材料和體積
                </div>
              </div>
            </label>
          )}

          <label className="flex items-start">
            <input
              type="radio"
              name="packaging"
              value="STANDARD"
              defaultChecked={suggestedPackagingOption === 'STANDARD'}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium text-gray-700">標準包裝</div>
              <div className="text-sm text-gray-500">
                每雙鞋子獨立包裝，保護更完善
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 總運費估算 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">預估總運費</span>
          <span className="text-lg font-semibold text-gray-900">
            NT$ {estimatedShippingFee}
          </span>
        </div>
        {requiresBatching && (
          <div className="text-sm text-gray-500 mt-1">
            需分 {batches.length} 批配送，運費分別計算
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      {requiresBatching && !acceptedSuggestion && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            onClick={() => optimizeBatching()}
            disabled={optimizing}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {optimizing ? '優化中...' : '接受智能分批建議'}
          </button>
        </div>
      )}

      {acceptedSuggestion && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700">
            ✓ 已套用智能分批建議，請前往結帳
          </div>
        </div>
      )}
    </div>
  )
}