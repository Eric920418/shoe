'use client'

/**
 * 結帳頁面 - 收集運送資訊並創建訂單
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_CART, CREATE_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import CreditSelector from '@/components/checkout/CreditSelector'

interface FormData {
  shippingName: string
  shippingPhone: string
  shippingCity: string
  shippingDistrict: string
  shippingStreet: string
  shippingZipCode: string
  shippingCountry: string
  paymentMethod: string
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    shippingName: '',
    shippingPhone: '',
    shippingCity: '',
    shippingDistrict: '',
    shippingStreet: '',
    shippingZipCode: '',
    shippingCountry: '台灣',
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creditsToUse, setCreditsToUse] = useState(0)

  // 如果未登入，跳轉到登入頁面
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('請先登入以進行結帳')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  // 預填用戶資訊
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        shippingName: user.name || '',
        shippingPhone: user.phone || '',
      }))
    }
  }, [user])

  const { data: cartData, loading: cartLoading } = useQuery(GET_CART, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER, {
    onCompleted: (data) => {
      alert('訂單創建成功！')
      router.push(`/orders/${data.createOrder.id}`)
    },
    onError: (error) => {
      console.error('創建訂單失敗:', error)
      alert(error.message || '創建訂單失敗，請重試')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 清除錯誤訊息
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.shippingName.trim()) {
      newErrors.shippingName = '請輸入收件人姓名'
    }
    if (!formData.shippingPhone.trim()) {
      newErrors.shippingPhone = '請輸入收件人手機'
    } else if (!/^09\d{8}$/.test(formData.shippingPhone.trim())) {
      newErrors.shippingPhone = '請輸入有效的台灣手機號碼'
    }
    if (!formData.shippingCity.trim()) {
      newErrors.shippingCity = '請輸入城市'
    }
    if (!formData.shippingDistrict.trim()) {
      newErrors.shippingDistrict = '請輸入區域'
    }
    if (!formData.shippingStreet.trim()) {
      newErrors.shippingStreet = '請輸入街道地址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await createOrder({
        variables: {
          input: {
            shippingName: formData.shippingName.trim(),
            shippingPhone: formData.shippingPhone.trim(),
            shippingCountry: formData.shippingCountry,
            shippingCity: formData.shippingCity.trim(),
            shippingDistrict: formData.shippingDistrict.trim(),
            shippingStreet: formData.shippingStreet.trim(),
            shippingZipCode: formData.shippingZipCode.trim(),
            paymentMethod: formData.paymentMethod,
            notes: formData.notes.trim() || null,
            creditsToUse: creditsToUse > 0 ? creditsToUse : null,
          },
        },
      })
    } catch (error) {
      console.error('提交訂單失敗:', error)
    }
  }

  // 載入中狀態
  if (authLoading || cartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取購物車資訊</p>
        </div>
      </div>
    )
  }

  const cart = cartData?.cart

  // 空購物車
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">購物車是空的</h1>
          <p className="text-gray-600 mb-8">請先新增商品到購物車</p>
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
        <h1 className="text-3xl font-bold text-gray-900">結帳</h1>
        <p className="text-gray-600 mt-2">請填寫收件資訊以完成訂單</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：收件資訊表單 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 收件人資訊 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">收件人資訊</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shippingName" className="block text-sm font-medium text-gray-700 mb-1">
                    收件人姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="shippingName"
                    name="shippingName"
                    value={formData.shippingName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.shippingName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="請輸入收件人姓名"
                  />
                  {errors.shippingName && (
                    <p className="mt-1 text-sm text-red-600">{errors.shippingName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="shippingPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    收件人手機 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="shippingPhone"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.shippingPhone ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="0912345678"
                  />
                  {errors.shippingPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.shippingPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 收件地址 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">收件地址</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700 mb-1">
                    城市 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="shippingCity"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.shippingCity ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="例如：台北市"
                  />
                  {errors.shippingCity && (
                    <p className="mt-1 text-sm text-red-600">{errors.shippingCity}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="shippingDistrict" className="block text-sm font-medium text-gray-700 mb-1">
                    區域 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="shippingDistrict"
                    name="shippingDistrict"
                    value={formData.shippingDistrict}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.shippingDistrict ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="例如：信義區"
                  />
                  {errors.shippingDistrict && (
                    <p className="mt-1 text-sm text-red-600">{errors.shippingDistrict}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="shippingZipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    郵遞區號
                  </label>
                  <input
                    type="text"
                    id="shippingZipCode"
                    name="shippingZipCode"
                    value={formData.shippingZipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例如：110"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="shippingStreet" className="block text-sm font-medium text-gray-700 mb-1">
                  街道地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="shippingStreet"
                  name="shippingStreet"
                  value={formData.shippingStreet}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.shippingStreet ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="例如：信義路五段7號"
                />
                {errors.shippingStreet && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingStreet}</p>
                )}
              </div>
            </div>

            {/* 付款方式 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">付款方式</h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={formData.paymentMethod === 'BANK_TRANSFER'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">銀行轉帳</div>
                    <div className="text-sm text-gray-600">訂單確認後將提供匯款資訊</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="LINE_PAY"
                    checked={formData.paymentMethod === 'LINE_PAY'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">LINE Pay</div>
                    <div className="text-sm text-gray-600">使用 LINE Pay 線上支付</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">貨到付款</div>
                    <div className="text-sm text-gray-600">收到商品時現金付款</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 備註 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">訂單備註</h2>

              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="如有特殊需求請在此說明（選填）"
              />
            </div>
          </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">訂單摘要</h2>

              {/* 商品列表 */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          無圖
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        數量: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        NT$ {item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 購物金選擇器 */}
              <div className="mb-4">
                <CreditSelector
                  subtotal={cart.total}
                  onChange={setCreditsToUse}
                />
              </div>

              {/* 價格明細 */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>商品小計</span>
                  <span>NT$ {cart.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>運費</span>
                  <span className="text-green-600">免運費</span>
                </div>
                {creditsToUse > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>購物金折抵</span>
                    <span>-NT$ {creditsToUse.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">總計</span>
                    <span className="text-2xl font-bold text-primary-600">
                      NT$ {Math.max(0, cart.total - creditsToUse).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 提交按鈕 */}
              <button
                type="submit"
                disabled={creating}
                className="w-full mt-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '處理中...' : '確認訂單'}
              </button>

              <Link
                href="/cart"
                className="block w-full mt-3 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回購物車
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
