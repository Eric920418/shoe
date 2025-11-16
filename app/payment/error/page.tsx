'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '發生未知錯誤';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* 錯誤圖示 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          系統錯誤
        </h1>

        <p className="text-center text-gray-600 mb-6">
          {message}
        </p>

        {/* 錯誤說明 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800">
            請稍後再試，或聯繫客服協助處理。我們將盡快為您解決問題。
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          <Link
            href="/orders"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            查看我的訂單
          </Link>

          <Link
            href="/account/support"
            className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            聯繫客服
          </Link>

          <Link
            href="/"
            className="block w-full text-blue-600 text-center py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>}>
      <PaymentErrorContent />
    </Suspense>
  );
}
