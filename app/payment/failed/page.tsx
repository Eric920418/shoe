'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const message = searchParams.get('message') || '支付失敗，請稍後再試';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* 失敗圖示 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          支付失敗
        </h1>

        <p className="text-center text-gray-600 mb-6">
          {message}
        </p>

        {/* 訂單資訊 */}
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">訂單編號</span>
              <span className="font-mono font-medium">{orderId.substring(0, 12)}...</span>
            </div>
          </div>
        )}

        {/* 建議 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-900 mb-2">您可以嘗試：</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>重新選擇支付方式</li>
            <li>檢查銀行卡餘額是否足夠</li>
            <li>聯繫客服獲取協助</li>
          </ul>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              重新支付
            </Link>
          )}

          <Link
            href="/account/orders"
            className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            查看我的訂單
          </Link>

          <Link
            href="/account/support"
            className="block w-full text-blue-600 text-center py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            聯繫客服
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
