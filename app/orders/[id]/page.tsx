'use client'

/**
 * �s�b
 */

import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_ORDER, CANCEL_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

// ��Ko:Mn
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: '�U', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  CONFIRMED: { label: '�', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  PROCESSING: { label: 'U-', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  SHIPPED: { label: '���', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: '�', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: '�ֈ', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

// �>�KMn
const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: '��>', color: 'text-yellow-600' },
  PAID: { label: '��>', color: 'text-green-600' },
  FAILED: { label: '�>1W', color: 'text-red-600' },
}

// �>�Mn
const PAYMENT_METHOD_CONFIG: Record<string, string> = {
  BANK_TRANSFER: '�LI3',
  LINE_PAY: 'LINE Pay',
  COD: '�0�>',
  CREDIT_CARD: '�(a',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // ��*{e�I0{eb
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('�H{e���')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, error, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    skip: !isAuthenticated || !orderId,
    fetchPolicy: 'network-only',
  })

  const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_ORDER, {
    onCompleted: () => {
      alert('��ֈ')
      refetch()
    },
    onError: (error) => {
      console.error('ֈ�1W:', error)
      alert(error.message || 'ֈ�1W��f')
    },
  })

  const handleCancelOrder = async () => {
    if (!order) return

    if (!confirm(`���ֈ� ${order.orderNumber} �`)) {
      return
    }

    try {
      await cancelOrder({
        variables: {
          id: order.id,
        },
      })
    } catch (error) {
      console.error('ֈ�1W:', error)
    }
  }

  // 	e-�K
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">	e-...</div>
          <p className="text-gray-600">c(r���
</p>
        </div>
      </div>
    )
  }

  // /��K
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600 mb-2">	e1W</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Ͱ	e
            </button>
            <Link
              href="/orders"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ���h
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const order = data?.order

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">�X(</div>
          <Link
            href="/orders"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            ���h
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING
  const paymentMethodLabel = PAYMENT_METHOD_CONFIG[order.paymentMethod] || order.paymentMethod

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* bL */}
      <div className="mb-8">
        <Link href="/orders" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          � ���h
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">�s�</h1>
            <p className="text-gray-600 mt-2">��_: {order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`text-sm font-medium ${paymentConfig.color}`}>
              {paymentConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* �t�s� */}
        <div className="lg:col-span-2 space-y-6">
          {/* F�h */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">�F�</h2>

            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.productImage || item.product?.images?.[0] ? (
                      <Image
                        src={item.productImage || item.product.images[0]}
                        alt={item.productName || item.product?.name || 'F�'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        !G
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.productName || item.product?.name || '*�F�'}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {item.sizeEu && (
                        <div>:�: EU {item.sizeEu}</div>
                      )}
                      {item.color && (
                        <div>Or: {item.color}</div>
                      )}
                      {item.sku && (
                        <div className="text-xs">SKU: {item.sku}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">x�: {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-900">
                      NT$ {item.price.toLocaleString()}
                    </p>
                    <p className="text-base font-bold text-gray-900 mt-2">
                      NT$ {item.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* M�
 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">M�
</h2>

            <div className="space-y-3">
              <div className="flex">
                <span className="w-24 text-gray-600">6��:</span>
                <span className="font-medium text-gray-900">{order.shippingName}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-600">oa�q:</span>
                <span className="font-medium text-gray-900">{order.shippingPhone}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-600">M0@:</span>
                <span className="font-medium text-gray-900">
                  {order.shippingCountry} {order.shippingCity} {order.shippingDistrict}{' '}
                  {order.shippingStreet}
                  {order.shippingZipCode && ` (${order.shippingZipCode})`}
                </span>
              </div>
              {order.notes && (
                <div className="flex">
                  <span className="w-24 text-gray-600">�;:</span>
                  <span className="text-gray-900">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* �t�X� */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4 space-y-6">
            {/* �X� */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">�X�</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>F�</span>
                  <span>NT$ {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>K�</span>
                  <span>
                    {order.shippingFee === 0 ? (
                      <span className="text-green-600">MK�</span>
                    ) : (
                      `NT$ ${order.shippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>�c</span>
                    <span>-NT$ {order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">=</span>
                    <span className="text-2xl font-bold text-primary-600">
                      NT$ {order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* �>�
 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">�>�
</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">�>�</span>
                  <span className="font-medium text-gray-900">{paymentMethodLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">�>�K</span>
                  <span className={`font-medium ${paymentConfig.color}`}>
                    {paymentConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* ��
 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">��
</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">��B�</span>
                  <span className="text-gray-900">
                    {new Date(order.createdAt).toLocaleString('zh-TW')}
                  </span>
                </div>
              </div>
            </div>

            {/* �\	 */}
            {order.status !== 'CANCELLED' &&
              order.status !== 'COMPLETED' &&
              order.status !== 'SHIPPED' && (
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                  >
                    {cancelling ? 'U-...' : 'ֈ�'}
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
