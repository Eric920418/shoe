'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, gql } from '@apollo/client'
import { X, ShoppingCart, Check, AlertCircle } from 'lucide-react'
import { ADD_TO_CART, GET_CART } from '@/graphql/queries'
import toast from 'react-hot-toast'

// 查詢產品詳細資訊（包含尺碼和變體）
const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($id: ID!) {
    product(id: $id) {
      id
      name
      price
      images
      variants {
        id
        name
        color
        colorHex
        stock
        isActive
      }
      sizeCharts {
        id
        eu
        us
        uk
        cm
        stock
        isActive
      }
    }
  }
`

interface QuickAddToCartModalProps {
  productId: string
  productName: string
  onClose: () => void
}

export default function QuickAddToCartModal({
  productId,
  productName,
  onClose
}: QuickAddToCartModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  // 查詢產品詳情
  const { data, loading, error } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { id: productId },
  })

  // 加入購物車 Mutation
  const [addToCart, { loading: adding }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART }],
    onCompleted: () => {
      toast.success('已加入購物車！', {
        icon: '🛒',
        duration: 2000,
      })
      onClose()
    },
    onError: (error) => {
      console.error('加入購物車失敗:', error)
      toast.error(error.message || '加入購物車失敗，請稍後再試', {
        duration: 3000,
      })
    },
  })

  const product = data?.product

  // 處理加入購物車
  const handleAddToCart = async () => {
    if (!selectedSizeId) {
      toast.error('請選擇尺碼', { duration: 2000 })
      return
    }

    try {
      await addToCart({
        variables: {
          productId,
          variantId: selectedVariantId,
          sizeChartId: selectedSizeId,
          quantity,
        },
      })
    } catch (error) {
      // 錯誤已在 onError 中處理
    }
  }

  // 獲取選中尺碼的庫存
  const selectedSizeStock = product?.sizeCharts?.find(
    (size: any) => size.id === selectedSizeId
  )?.stock || 0

  // 阻止背景滾動
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal 容器 */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">快速加入購物車</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={adding}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="text-red-500 mb-3" size={48} />
              <p className="text-red-600 font-medium mb-2">載入失敗</p>
              <p className="text-gray-500 text-sm">{error.message}</p>
            </div>
          )}

          {product && (
            <div className="space-y-6">
              {/* 產品名稱 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-2xl font-bold text-orange-600">
                  NT$ {Number(product.price).toLocaleString()}
                </p>
              </div>

              {/* 顏色選擇（如果有變體） */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    選擇顏色
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {product.variants
                      .filter((variant: any) => variant.isActive)
                      .map((variant: any) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`relative border-2 rounded-lg p-3 transition-all ${
                            selectedVariantId === variant.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full aspect-square rounded-md mb-2"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {variant.color}
                          </p>
                          {selectedVariantId === variant.id && (
                            <div className="absolute top-1 right-1 bg-orange-500 rounded-full p-0.5">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* 尺碼選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  選擇尺碼 <span className="text-red-500">*</span>
                </label>
                {product.sizeCharts && product.sizeCharts.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizeCharts
                      .filter((size: any) => size.isActive)
                      .map((size: any) => {
                        const isOutOfStock = size.stock === 0
                        const isSelected = selectedSizeId === size.id

                        return (
                          <button
                            key={size.id}
                            onClick={() => !isOutOfStock && setSelectedSizeId(size.id)}
                            disabled={isOutOfStock}
                            className={`relative border-2 rounded-lg p-3 transition-all ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50'
                                : isOutOfStock
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-center">
                              <p className="font-bold text-gray-900">EU {size.eu}</p>
                              <p className="text-xs text-gray-500">US {size.us}</p>
                            </div>
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded">
                                  售完
                                </span>
                              </div>
                            )}
                            {isSelected && !isOutOfStock && (
                              <div className="absolute top-1 right-1 bg-orange-500 rounded-full p-0.5">
                                <Check size={12} className="text-white" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto mb-2" size={32} />
                    <p>此商品暫無可用尺碼</p>
                  </div>
                )}
              </div>

              {/* 數量選擇 */}
              {selectedSizeId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    數量
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedSizeStock}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setQuantity(Math.max(1, Math.min(val, selectedSizeStock)))
                      }}
                      className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg font-bold text-gray-900"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedSizeStock, quantity + 1))}
                      disabled={quantity >= selectedSizeStock}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-700"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500 ml-2">
                      庫存：{selectedSizeStock} 件
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={adding}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!selectedSizeId || adding || loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {adding ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>加入中...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                <span>加入購物車</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
