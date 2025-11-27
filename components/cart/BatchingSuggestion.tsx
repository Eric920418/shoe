'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'

// GraphQL 查詢
const ANALYZE_CART_BATCHING = gql`
  query AnalyzeCartForBatching {
    analyzeCartForBatching {
      totalItems
      canCombinePackaging
      warnings
      suggestions
      # 貨到付款限制
      codStandardLimit
      codCombinedLimit
      exceedsStandardLimit
      exceedsCombinedLimit
      # 數量調整建議
      standardPackagingAdjustments {
        cartItemId
        productName
        currentQuantity
        suggestedQuantity
        reason
      }
      combinedPackagingAdjustments {
        cartItemId
        productName
        currentQuantity
        suggestedQuantity
        reason
      }
    }
  }
`

const APPLY_SMART_QUANTITY_ADJUSTMENTS = gql`
  mutation ApplySmartQuantityAdjustments($packagingType: String) {
    applySmartQuantityAdjustments(packagingType: $packagingType) {
      cart {
        id
        items {
          id
          quantity
        }
      }
      adjustedItems
      removedItems
      message
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
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false)
  const [selectedPackaging, setSelectedPackaging] = useState<'STANDARD' | 'COMBINED'>('COMBINED')

  // 只有已登入用戶才執行分析
  const { data, loading, error, refetch } = useQuery(ANALYZE_CART_BATCHING, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [applyQuantityAdjustments, { loading: adjusting }] = useMutation(APPLY_SMART_QUANTITY_ADJUSTMENTS, {
    onCompleted: (data) => {
      setAcceptedSuggestion(true)
      alert(data.applySmartQuantityAdjustments.message)
      if (onBatchingOptimized) {
        onBatchingOptimized()
      }
      refetch()
    },
    onError: (error) => {
      console.error('套用數量調整失敗:', error)
      alert('套用數量調整失敗，請重試')
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
    totalItems,
    canCombinePackaging,
    codStandardLimit,
    codCombinedLimit,
    exceedsStandardLimit,
    exceedsCombinedLimit,
    standardPackagingAdjustments,
    combinedPackagingAdjustments,
    warnings,
    suggestions,
  } = analysis

  // 根據選擇的包裝方式決定要顯示的調整建議
  const currentAdjustments = selectedPackaging === 'STANDARD'
    ? standardPackagingAdjustments
    : combinedPackagingAdjustments

  const currentLimit = selectedPackaging === 'STANDARD' ? codStandardLimit : codCombinedLimit
  const exceedsLimit = selectedPackaging === 'STANDARD' ? exceedsStandardLimit : exceedsCombinedLimit

  // 如果不需要調整，不顯示組件
  const needsAdjustment = exceedsLimit && currentAdjustments && currentAdjustments.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* 標題區 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          貨到付款配送限制
        </h3>
        <span className="text-sm text-gray-500">
          購物車共 {totalItems} 件
        </span>
      </div>

      {/* 說明區 */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>7-11 貨到付款限制：</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• 單獨包裝：限購 <strong>{codStandardLimit}</strong> 件</li>
          {canCombinePackaging && codCombinedLimit > 0 && (
            <li>• 合併包裝：限購 <strong>{codCombinedLimit}</strong> 件</li>
          )}
          <li className="text-blue-600 mt-2">※ 其他付款方式無數量限制</li>
        </ul>
      </div>

      {/* 包裝選項 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">選擇包裝方式（貨到付款用）</h4>
        <div className="space-y-3">
          {canCombinePackaging && codCombinedLimit > 0 && (
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="packaging"
                value="COMBINED"
                checked={selectedPackaging === 'COMBINED'}
                onChange={() => setSelectedPackaging('COMBINED')}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">合併包裝</span>
                  <span className={`text-sm ${totalItems <= codCombinedLimit ? 'text-green-600' : 'text-red-600'}`}>
                    {totalItems <= codCombinedLimit ? '符合限制' : `超過 ${totalItems - codCombinedLimit} 件`}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  多雙鞋子裝在同一個盒子，最多可購買 {codCombinedLimit} 件
                </div>
              </div>
            </label>
          )}

          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="packaging"
              value="STANDARD"
              checked={selectedPackaging === 'STANDARD'}
              onChange={() => setSelectedPackaging('STANDARD')}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">單獨包裝</span>
                <span className={`text-sm ${totalItems <= codStandardLimit ? 'text-green-600' : 'text-red-600'}`}>
                  {totalItems <= codStandardLimit ? '符合限制' : `超過 ${totalItems - codStandardLimit} 件`}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                每雙鞋子獨立包裝，限購 {codStandardLimit} 件
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 數量調整建議 */}
      {needsAdjustment && !acceptedSuggestion && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            需要調整購物車數量
          </h4>
          <p className="text-sm text-yellow-700 mb-3">
            {selectedPackaging === 'STANDARD'
              ? `單獨包裝限購 ${codStandardLimit} 件，建議調整：`
              : `合併包裝限購 ${codCombinedLimit} 件，建議調整：`
            }
          </p>
          <div className="space-y-2">
            {currentAdjustments.map((adj: any) => (
              <div key={adj.cartItemId} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-100">
                <div>
                  <div className="font-medium text-gray-900">{adj.productName}</div>
                  <div className="text-sm text-gray-600">{adj.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    <span className="line-through">{adj.currentQuantity} 件</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium text-yellow-700">
                      {adj.suggestedQuantity === 0 ? '移除' : `${adj.suggestedQuantity} 件`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <div className="text-sm text-yellow-700">
              調整後總數量：<span className="font-medium">{currentLimit} 件</span>
            </div>
          </div>
        </div>
      )}

      {/* 警告訊息 */}
      {warnings && warnings.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <ul className="text-sm text-red-700 space-y-1">
            {warnings.map((warning: string, index: number) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 操作按鈕 */}
      {needsAdjustment && !acceptedSuggestion && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            或選擇其他付款方式，無數量限制
          </p>
          <button
            onClick={() => applyQuantityAdjustments({
              variables: { packagingType: selectedPackaging }
            })}
            disabled={adjusting}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {adjusting ? '調整中...' : '接受智能配送建議'}
          </button>
        </div>
      )}

      {/* 成功訊息 */}
      {acceptedSuggestion && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700">
            ✓ 已調整購物車數量，可使用貨到付款結帳
          </div>
        </div>
      )}

      {/* 符合限制時的提示 */}
      {!needsAdjustment && !acceptedSuggestion && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700">
            ✓ 購物車符合{selectedPackaging === 'STANDARD' ? '單獨' : '合併'}包裝的貨到付款限制
          </div>
        </div>
      )}
    </div>
  )
}
