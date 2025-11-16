'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!orderId) {
      router.push('/account/orders');
      return;
    }

    // 倒數計時自動跳轉
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/orders/${orderId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* 成功圖示 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          支付成功！
        </h1>

        <p className="text-center text-gray-600 mb-6">
          您的訂單已完成支付，我們將盡快為您處理。
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

        {/* 提示訊息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            訂單確認郵件已發送到您的信箱，請留意查收。
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          <Link
            href={`/orders/${orderId}`}
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            查看訂單詳情
          </Link>

          <Link
            href="/products"
            className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            繼續購物
          </Link>
        </div>

        {/* 自動跳轉提示 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {countdown} 秒後自動跳轉到訂單詳情頁
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
