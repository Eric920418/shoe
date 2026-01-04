'use client'

/**
 * 增強版結帳頁面 - 整合藍新金流支付系統
 * 支援功能：
 * - 藍新金流多元支付（信用卡、ATM、超商代碼）
 * - 優惠券使用
 * - 購物金使用
 * - 積分累積
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_CART, CREATE_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import { useGuestCart } from '@/contexts/GuestCartContext'
import CreditSelector from '@/components/checkout/CreditSelector'
import CouponInput from '@/components/checkout/CouponInput'
import MembershipBenefitsBanner from '@/components/common/MembershipBenefitsBanner'
import toast from 'react-hot-toast'

// 解析圖片陣列
const parseImages = (images: string[] | string): string[] => {
  try {
    if (typeof images === 'string') {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : []
    }
    return Array.isArray(images) ? images : []
  } catch {
    return []
  }
}

interface CheckoutFormData {
  // 訪客資訊（訪客結帳時必填）
  guestName: string
  guestPhone: string
  guestEmail: string
  // 收件資訊
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

export default function EnhancedCheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const guestCart = useGuestCart()

  const [formData, setFormData] = useState<CheckoutFormData>({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    shippingName: '',
    shippingPhone: '',
    shippingCity: '',
    shippingDistrict: '',
    shippingStreet: '',
    shippingZipCode: '',
    shippingCountry: '台灣',
    paymentMethod: 'NEWEBPAY', // 預設使用藍新金流
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creditsToUse, setCreditsToUse] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [processingPayment, setProcessingPayment] = useState(false)

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

  // 會員模式：從 GraphQL 獲取購物車
  const { data: cartData, loading: cartLoading } = useQuery(GET_CART, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER, {
    onCompleted: async (data) => {
      const order = data.createOrder

      // 如果選擇藍新金流支付，跳轉到支付頁面
      if (formData.paymentMethod === 'NEWEBPAY') {
        setProcessingPayment(true)

        try {
          // 呼叫藍新金流 API 創建支付
          const response = await fetch('/api/newebpay/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              paymentTypes: ['CREDIT_CARD', 'VACC', 'CVS'], // 啟用多種支付方式
              itemDesc: `訂單 ${order.orderNumber}`,
            }),
          })

          const paymentData = await response.json()

          if (paymentData.success) {
            // 動態建立表單並提交到藍新金流
            const { mpgUrl, formData } = paymentData.data

            const form = document.createElement('form')
            form.method = 'POST'
            form.action = mpgUrl
            form.style.display = 'none'

            Object.entries(formData).forEach(([key, value]) => {
              const input = document.createElement('input')
              input.type = 'hidden'
              input.name = key
              input.value = value as string
              form.appendChild(input)
            })

            document.body.appendChild(form)

            // 清空購物車（訪客模式）
            if (!isAuthenticated) {
              guestCart.clearCart()
            }

            // 顯示提示訊息
            toast.success('正在跳轉到支付頁面...')

            // 提交表單到藍新金流
            setTimeout(() => {
              form.submit()
            }, 1000)
          } else {
            throw new Error(paymentData.error || '創建支付失敗')
          }
        } catch (error) {
          console.error('創建支付失敗:', error)
          toast.error('創建支付失敗，請稍後再試')
          setProcessingPayment(false)
        }
      } else {
        // 其他支付方式（銀行轉帳等）
        toast.success('訂單創建成功！')

        // 清空購物車（訪客模式）
        if (!isAuthenticated) {
          guestCart.clearCart()
        }

        // 跳轉到訂單完成頁
        router.push(`/orders/success?orderNumber=${order.orderNumber}&phone=${formData.guestPhone || user?.phone}`)
      }
    },
    onError: (error) => {
      console.error('創建訂單失敗:', error)
      toast.error(error.message || '創建訂單失敗，請重試')
      setProcessingPayment(false)
    },
  })

  // 判斷是否為訪客模式
  const isGuest = !isAuthenticated

  // 獲取購物車數據（會員或訪客）
  const cartItems = isGuest ? guestCart.items : (cartData?.cart?.items || [])
  const cartSubtotal = isGuest ? guestCart.total : (cartData?.cart?.total || 0)
  const cartIsEmpty = cartItems.length === 0

  // 計算總金額（扣除優惠券和購物金）
  const shippingFee = 0 // 運費（可根據條件調整）
  const totalDiscount = couponDiscount + creditsToUse
  const finalTotal = Math.max(0, cartSubtotal + shippingFee - totalDiscount)

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

    // 訪客模式：驗證訪客資訊
    if (isGuest) {
      if (!formData.guestName.trim()) {
        newErrors.guestName = '請輸入您的姓名'
      }
      if (!formData.guestPhone.trim()) {
        newErrors.guestPhone = '請輸入您的手機號碼'
      } else if (!/^09\d{8}$/.test(formData.guestPhone.trim())) {
        newErrors.guestPhone = '請輸入有效的台灣手機號碼'
      }
      // Email 選填但要驗證格式
      if (formData.guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail.trim())) {
        newErrors.guestEmail = '請輸入有效的電子郵件'
      }
    }

    // 收件資訊驗證
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

  const handleApplyCoupon = (code: string, discount: number) => {
    setCouponCode(code)
    setCouponDiscount(discount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // 訪客模式：從 guestCart.items 構建訂單項目
      const orderItems = isGuest
        ? guestCart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            sizeEu: item.sizeEu,
            quantity: item.quantity,
          }))
        : undefined // 會員模式：後端從購物車獲取

      await createOrder({
        variables: {
          input: {
            // 訪客資訊
            isGuest,
            guestName: isGuest ? formData.guestName.trim() : null,
            guestPhone: isGuest ? formData.guestPhone.trim() : null,
            guestEmail: isGuest && formData.guestEmail ? formData.guestEmail.trim() : null,
            // 訂單項目（僅訪客模式需要）
            items: orderItems,
            // 收件資訊
            shippingName: formData.shippingName.trim(),
            shippingPhone: formData.shippingPhone.trim(),
            shippingCountry: formData.shippingCountry,
            shippingCity: formData.shippingCity.trim(),
            shippingDistrict: formData.shippingDistrict.trim(),
            shippingStreet: formData.shippingStreet.trim(),
            shippingZipCode: formData.shippingZipCode.trim(),
            paymentMethod: formData.paymentMethod,
            notes: formData.notes.trim() || null,
            // 優惠券和購物金
            couponCode: couponCode || null,
            creditsToUse: !isGuest && creditsToUse > 0 ? creditsToUse : null,
          },
        },
      })
    } catch (error) {
      console.error('提交訂單失敗:', error)
    }
  }

  // 載入中狀態
  if (!isGuest && (authLoading || cartLoading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取購物車資訊</p>
        </div>
      </div>
    )
  }

  // 空購物車
  if (cartIsEmpty) {
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
    <div className="min-h-screen bg-white">
      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <h1 className="text-2xl font-bold text-black mb-8">結帳</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* 左側：收件資訊表單 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 訪客模式：會員好處提示 */}
              {isGuest && (
                <MembershipBenefitsBanner variant="prominent" />
              )}

              {/* 訪客模式：訪客資訊表單 */}
              {isGuest && (
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-2">
                    聯絡資訊
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    請提供您的聯絡資訊以便追蹤訂單
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="guestName" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        您的姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="guestName"
                        name="guestName"
                        value={formData.guestName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.guestName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="請輸入您的姓名"
                      />
                      {errors.guestName && (
                        <p className="mt-2 text-sm text-red-600">{errors.guestName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="guestPhone" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        您的手機號碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="guestPhone"
                        name="guestPhone"
                        value={formData.guestPhone}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.guestPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="0912345678"
                      />
                      {errors.guestPhone && (
                        <p className="mt-2 text-sm text-red-600">{errors.guestPhone}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="guestEmail" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        電子郵件（選填）
                      </label>
                      <input
                        type="email"
                        id="guestEmail"
                        name="guestEmail"
                        value={formData.guestEmail}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.guestEmail ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="your@email.com"
                      />
                      {errors.guestEmail && (
                        <p className="mt-2 text-sm text-red-600">{errors.guestEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 收件人資訊 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">
                  收件人資訊
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="shippingName" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      收件人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingName"
                      name="shippingName"
                      value={formData.shippingName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.shippingName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="請輸入姓名"
                    />
                    {errors.shippingName && (
                      <p className="mt-2 text-sm text-red-600">{errors.shippingName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="shippingPhone" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      收件人手機 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="shippingPhone"
                      name="shippingPhone"
                      value={formData.shippingPhone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.shippingPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="0912345678"
                    />
                    {errors.shippingPhone && (
                      <p className="mt-2 text-sm text-red-600">{errors.shippingPhone}</p>
                    )}
                  </div>

                  {/* 收件地址 */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="shippingCity" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                          城市 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="shippingCity"
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 ${errors.shippingCity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                          placeholder="台北市"
                        />
                        {errors.shippingCity && (
                          <p className="mt-2 text-sm text-red-600">{errors.shippingCity}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="shippingDistrict" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                          區域 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="shippingDistrict"
                          name="shippingDistrict"
                          value={formData.shippingDistrict}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 ${errors.shippingDistrict ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                          placeholder="信義區"
                        />
                        {errors.shippingDistrict && (
                          <p className="mt-2 text-sm text-red-600">{errors.shippingDistrict}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="shippingStreet" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        街道地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="shippingStreet"
                        name="shippingStreet"
                        value={formData.shippingStreet}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.shippingStreet ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="信義路五段7號"
                      />
                      {errors.shippingStreet && (
                        <p className="mt-2 text-sm text-red-600">{errors.shippingStreet}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="shippingZipCode" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        郵遞區號
                      </label>
                      <input
                        type="text"
                        id="shippingZipCode"
                        name="shippingZipCode"
                        value={formData.shippingZipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                        placeholder="110"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 付款方式 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">付款方式</h2>

                <div className="space-y-4">
                  {/* 藍新金流（線上支付） */}
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'NEWEBPAY' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="NEWEBPAY"
                      checked={formData.paymentMethod === 'NEWEBPAY'}
                      onChange={handleChange}
                      className="w-5 h-5 mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black flex items-center">
                        線上支付
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">推薦</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        支援信用卡、ATM轉帳、超商代碼繳費
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">信用卡</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">ATM</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">超商繳費</span>
                      </div>
                    </div>
                  </label>

                  {/* 銀行轉帳 */}
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'BANK_TRANSFER' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={formData.paymentMethod === 'BANK_TRANSFER'}
                      onChange={handleChange}
                      className="w-5 h-5 mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">銀行轉帳</div>
                      <div className="text-sm text-gray-600">訂單確認後將提供匯款資訊</div>
                    </div>
                  </label>

                  {/* 貨到付款 */}
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'CASH_ON_DELIVERY' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_ON_DELIVERY"
                      checked={formData.paymentMethod === 'CASH_ON_DELIVERY'}
                      onChange={handleChange}
                      className="w-5 h-5 mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">貨到付款</div>
                      <div className="text-sm text-gray-600">收到商品時現金付款（需加收手續費 NT$60）</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 備註 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">訂單備註</h2>

                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                  placeholder="如有特殊需求請在此說明（選填）"
                />
              </div>
            </div>

            {/* 右側：訂單摘要 */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">
                    訂單摘要
                  </h2>

                  {/* 商品列表 */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cartItems.map((item: any, index: number) => {
                      // 訪客購物車與會員購物車數據結構不同
                      const productName = isGuest ? item.productName : item.product.name
                      const productImage = isGuest ? item.productImage : parseImages(item.product.images)[0]
                      const quantity = item.quantity
                      const subtotal = isGuest ? (item.price * item.quantity) : item.subtotal

                      return (
                        <div key={isGuest ? `guest-${index}` : item.id} className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                            {productImage ? (
                              <Image
                                src={productImage}
                                alt={productName}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                無圖
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">
                              {productName}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              尺寸: {item.sizeEu} | 數量: {quantity}
                            </p>
                            <p className="text-sm font-medium text-black mt-1">
                              NT$ {subtotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 優惠券輸入（所有用戶都可使用） */}
                  <div className="mb-6">
                    <CouponInput
                      orderAmount={cartSubtotal}
                      onApplyCoupon={handleApplyCoupon}
                    />
                  </div>

                  {/* 購物金選擇器（僅會員可用） */}
                  {!isGuest && (
                    <div className="mb-6">
                      <CreditSelector
                        subtotal={cartSubtotal}
                        onChange={setCreditsToUse}
                      />
                    </div>
                  )}

                  {/* 價格明細 */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">小計</span>
                      <span className="text-black font-medium">
                        NT$ {cartSubtotal.toLocaleString()}
                      </span>
                    </div>

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">優惠券折扣</span>
                        <span className="text-green-600 font-medium">
                          -NT$ {couponDiscount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {creditsToUse > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">購物金折抵</span>
                        <span className="text-green-600 font-medium">
                          -NT$ {creditsToUse.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">運費</span>
                      <span className="text-black font-medium">
                        {shippingFee === 0 ? '免運費' : `NT$ ${shippingFee.toLocaleString()}`}
                      </span>
                    </div>

                    {formData.paymentMethod === 'CASH_ON_DELIVERY' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">貨到付款手續費</span>
                        <span className="text-black font-medium">
                          NT$ 60
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 總計 */}
                  <div className="flex justify-between text-lg font-bold pt-4 border-t-2 border-gray-300">
                    <span>總計</span>
                    <span className="text-black">
                      NT$ {(formData.paymentMethod === 'CASH_ON_DELIVERY' ? finalTotal + 60 : finalTotal).toLocaleString()}
                    </span>
                  </div>

                  {/* 積分提示（僅會員顯示） */}
                  {!isGuest && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        此訂單將獲得 <span className="font-bold">{Math.floor(finalTotal * 0.01)}</span> 點會員積分
                      </p>
                    </div>
                  )}

                  {/* 提交按鈕 */}
                  <button
                    type="submit"
                    disabled={creating || processingPayment}
                    className="w-full mt-6 px-8 py-4 bg-black text-white font-bold uppercase tracking-wide rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processingPayment ? '正在處理支付...' : creating ? '處理中...' : formData.paymentMethod === 'NEWEBPAY' ? '前往支付' : '確認訂單'}
                  </button>

                  {/* 安全提示 */}
                  <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    安全加密結帳
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}