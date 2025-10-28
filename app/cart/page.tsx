'use client'

/**
 * 購物車頁面 - 使用真實 GraphQL API
 */

import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_CART, UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // 如果未登入，跳轉到登入頁面
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('請先登入以查看購物車')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, error, refetch } = useQuery(GET_CART, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [updateCartItem, { loading: updating }] = useMutation(UPDATE_CART_ITEM, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      console.error('更新失敗:', error)
      alert(error.message || '更新失敗，請重試')
    },
  })

  const [removeFromCart, { loading: removing }] = useMutation(REMOVE_FROM_CART, {
    onCompleted: () => {
      refetch()
      alert('商品已移除')
    },
    onError: (error) => {
      console.error('移除失敗:', error)
      alert(error.message || '移除失敗，請重試')
    },
  })

  const [clearCart, { loading: clearing }] = useMutation(CLEAR_CART, {
    onCompleted: () => {
      refetch()
      alert('購物車已清空')
    },
    onError: (error) => {
      console.error('清空失敗:', error)
      alert(error.message || '清空失敗，請重試')
    },
  })

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      await updateCartItem({
        variables: {
          cartItemId: itemId,
          quantity: newQuantity,
        },
      })
    } catch (error) {
      console.error('更新數量失敗:', error)
    }
  }

  const handleRemoveItem = async (itemId: string, productName: string) => {
    if (!confirm(`確定要移除「${productName}」嗎？`)) return

    try {
      await removeFromCart({
        variables: {
          cartItemId: itemId,
        },
      })
    } catch (error) {
      console.error('移除商品失敗:', error)
    }
  }

  const handleClearCart = async () => {
    if (!confirm('確定要清空購物車嗎？')) return

    try {
      await clearCart()
    } catch (error) {
      console.error('清空購物車失敗:', error)
    }
  }

  // 載入中狀態
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取購物車資訊</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600 mb-2">載入失敗</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  const cart = data?.cart
  const isProcessing = updating || removing || clearing

  // 空購物車狀態
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">購物車是空的</h1>
          <p className="text-gray-600 mb-8">還沒有新增任何商品到購物車</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            繼續購物
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">購物車</h1>
        <p className="text-gray-600 mt-2">共 {cart.totalItems} 件商品</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 購物車商品列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 清空購物車按鈕 */}
          <div className="flex justify-end">
            <button
              onClick={handleClearCart}
              disabled={isProcessing}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              清空購物車
            </button>
          </div>

          {/* 商品列表 */}
          {cart.items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex gap-4">
                {/* 商品圖片 */}
                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      無圖片
                    </div>
                  )}
                </div>

                {/* 商品資訊 */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.brand && (
                        <p className="text-sm text-gray-600">{item.product.brand.name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.product.name)}
                      disabled={isProcessing}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                      title="移除商品"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 規格資訊 */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {item.variant && (
                      <div className="flex items-center gap-2">
                        <span>顏色:</span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: item.variant.colorHex }}
                          />
                          <span>{item.variant.color}</span>
                        </div>
                      </div>
                    )}
                    {item.sizeChart && (
                      <div>
                        尺碼: EU {item.sizeChart.eu} / US {item.sizeChart.us} / UK {item.sizeChart.uk}
                      </div>
                    )}
                  </div>

                  {/* 價格和數量 */}
                  <div className="flex items-center justify-between">
                    {/* 數量調整 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">數量:</span>
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={isProcessing || item.quantity <= 1}
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isProcessing}
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 價格 */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        NT$ {item.subtotal.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        單價 NT$ {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 訂單摘要 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">訂單摘要</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>商品小計</span>
                <span>NT$ {cart.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>運費</span>
                <span className="text-green-600">免運費</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">總計</span>
                  <span className="text-2xl font-bold text-primary-600">
                    NT$ {cart.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-medium mb-3"
            >
              前往結帳
            </Link>

            <Link
              href="/"
              className="block w-full py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors"
            >
              繼續購物
            </Link>

            {/* 付款方式提示 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">支援付款方式:</p>
              <div className="flex gap-2">
                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  銀行轉帳
                </div>
                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  LINE Pay
                </div>
                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  貨到付款
                </div>
              </div>
            </div>

            {/* 安全提示 */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>安全結帳保護</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
