'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentType = searchParams.get('paymentType');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // 從 API 取得支付資訊
    fetch(`/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetPayment($orderId: ID!) {
            payment(orderId: $orderId) {
              id
              merchantOrderNo
              amount
              paymentType
              paymentTypeName
              atmBankCode
              atmVirtualAccount
              atmExpireDate
              cvsBankCode
              cvsPaymentNo
              cvsExpireDate
            }
          }
        `,
        variables: { orderId },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.payment) {
          setPaymentInfo(data.data.payment);
        }
      })
      .catch((error) => console.error('取得支付資訊失敗:', error))
      .finally(() => setLoading(false));
  }, [orderId]);

  const renderPaymentInstructions = () => {
    if (loading) {
      return <div className="text-center py-8 text-gray-600">載入中...</div>;
    }

    if (!paymentInfo) {
      return <div className="text-center py-8 text-red-600">無法取得支付資訊</div>;
    }

    // ATM 轉帳
    if (paymentType === 'VACC') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">ATM 轉帳資訊</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">銀行代碼</span>
                <span className="font-mono font-bold">{paymentInfo.atmBankCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">虛擬帳號</span>
                <span className="font-mono font-bold">{paymentInfo.atmVirtualAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">轉帳金額</span>
                <span className="font-bold text-blue-600">NT$ {paymentInfo.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">繳費期限</span>
                <span className="font-medium text-red-600">
                  {paymentInfo.atmExpireDate
                    ? new Date(paymentInfo.atmExpireDate).toLocaleString('zh-TW')
                    : '3 天內'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">注意事項</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>請使用 ATM 或網路銀行轉帳</li>
              <li>轉帳金額必須完全相符</li>
              <li>轉帳後約 30 分鐘內系統將自動確認</li>
              <li>逾期未繳費訂單將自動取消</li>
            </ul>
          </div>
        </div>
      );
    }

    // 超商代碼
    if (paymentType === 'CVS' || paymentType === 'BARCODE') {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-3">超商繳費資訊</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">繳費代碼</span>
                <span className="font-mono font-bold text-lg">{paymentInfo.cvsPaymentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">繳費金額</span>
                <span className="font-bold text-green-600">NT$ {paymentInfo.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">繳費期限</span>
                <span className="font-medium text-red-600">
                  {paymentInfo.cvsExpireDate
                    ? new Date(paymentInfo.cvsExpireDate).toLocaleString('zh-TW')
                    : '3 天內'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">繳費步驟</h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>前往 7-11、全家、萊爾富、OK 超商</li>
              <li>告知店員要使用代碼繳費</li>
              <li>提供繳費代碼給店員</li>
              <li>確認金額後繳費完成</li>
            </ol>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 等待圖示 */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* 標題 */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            等待繳費
          </h1>

          <p className="text-center text-gray-600 mb-8">
            請依照以下資訊完成繳費，繳費完成後系統將自動確認訂單。
          </p>

          {/* 繳費資訊 */}
          {renderPaymentInstructions()}

          {/* 操作按鈕 */}
          <div className="mt-8 space-y-3">
            <Link
              href={`/orders/${orderId}`}
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              查看訂單詳情
            </Link>

            <Link
              href="/account/orders"
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              返回訂單列表
            </Link>
          </div>

          {/* 客服聯繫 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              繳費遇到問題？
              <Link href="/account/support" className="text-blue-600 hover:underline ml-1">
                聯繫客服
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>}>
      <PaymentPendingContent />
    </Suspense>
  );
}
