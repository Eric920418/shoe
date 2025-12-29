'use client'

import React from 'react'
import Link from 'next/link'

const MarketplaceFooter = () => {
  return (
    <footer className="bg-gray-100 mt-12">
      {/* 公司資訊與版權聲明 */}
      <div className="bg-gray-800 text-gray-300 py-6">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* 公司登記資訊 */}
            <div className="text-xs sm:text-sm">
              <p className="font-semibold text-white mb-2">財神賣鞋</p>
              <p>統一編號：14975713</p>
              <p>營業地址：台中市自由路二段9號1樓</p>
              <p>客服電話：0923-101-058</p>
              <p>客服信箱：caishenmaixie@gmail.com</p>
            </div>

            {/* 快速連結 */}
            <div className="text-xs sm:text-sm">
              <p className="font-semibold text-white mb-2">法律政策</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/terms" className="hover:text-white transition-colors">服務條款</Link>
                <span>|</span>
                <Link href="/privacy" className="hover:text-white transition-colors">隱私權政策</Link>
                <span>|</span>
                <Link href="/refund-policy" className="hover:text-white transition-colors">退款政策</Link>
                <span>|</span>
                <Link href="/shopping-guide" className="hover:text-white transition-colors">購物須知</Link>
              </div>
            </div>
          </div>

          {/* 版權聲明 */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="text-xs text-center text-gray-400">
              <p>© {new Date().getFullYear()} 財神賣鞋 版權所有 All Rights Reserved.</p>
              <p className="mt-1">本網站所有內容（包括文字、圖片、影音等）均受著作權法保護，未經授權不得轉載或使用。</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default MarketplaceFooter