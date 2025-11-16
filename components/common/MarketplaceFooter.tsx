'use client'

import React from 'react'
import Link from 'next/link'
import {
  Phone, Mail, Clock, Shield, CreditCard, Truck, HeadphonesIcon,
  Facebook, Instagram, Twitter, Youtube, MessageCircle, MapPin
} from 'lucide-react'

const MarketplaceFooter = () => {
  const paymentMethods = ['信用卡', 'ATM', '超商代碼', '貨到付款', 'Line Pay']
  const shippingPartners = ['7-11', '全家', '宅配', '超商取貨']

  return (
    <footer className="bg-gray-100 mt-12">
      {/* 主要內容區 */}
      <div className="bg-white border-t-4 border-orange-500">
        <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
            {/* 客戶服務 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">客戶服務</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    幫助中心
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help#payment"
                    prefetch={false}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    付款方式
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help#shipping"
                    prefetch={false}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    運送方式
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help#returns"
                    prefetch={false}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    退貨退款
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    prefetch={false}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    聯絡我們
                  </Link>
                </li>
              </ul>
            </div>

            {/* 法律政策 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">法律政策</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    服務條款
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    隱私權政策
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund-policy"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    退款政策
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shopping-guide"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    購物須知
                  </Link>
                </li>
              </ul>
            </div>

            {/* 關於我們 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">關於鞋特賣</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    關於我們
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help#news"
                    prefetch={false}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    最新消息
                  </Link>
                </li>
                <li>
                  <Link
                    href="/brands"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    品牌介紹
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/referral"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    推薦獎勵
                  </Link>
                </li>
              </ul>
            </div>

            {/* 支付與物流 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">支付方式</h3>
              <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                {paymentMethods.map((method, idx) => (
                  <span key={idx} className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                    {method}
                  </span>
                ))}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">物流合作</h3>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {shippingPartners.map((partner, idx) => (
                  <span key={idx} className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                    {partner}
                  </span>
                ))}
              </div>
            </div>

            {/* 門市資訊 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">門市資訊</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={14} className="sm:w-4 sm:h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">門市地址</p>
                    <p>台中市自由路二段9號1樓</p>
                  </div>
                </div>
                <div className="text-gray-600">
                  <p className="font-semibold mb-1">營業時間</p>
                  <p>請來電預約</p>
                </div>
              </div>
              {/* 如果您有社群媒體，可在此處添加 */}
              {/*
              <div className="flex gap-2 sm:gap-3 mt-3 flex-wrap">
                <a href="您的FB連結" target="_blank" rel="noopener noreferrer"
                   className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Facebook size={16} />
                </a>
                <a href="您的IG連結" target="_blank" rel="noopener noreferrer"
                   className="bg-pink-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-pink-700 transition-colors">
                  <Instagram size={16} />
                </a>
              </div>
              */}
            </div>

            {/* 客服資訊 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">客服資訊</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                  <a href="tel:0923-101-058" className="hover:text-orange-600 transition-colors">0923-101-058</a>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle size={14} className="sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <a
                    href="https://lin.ee/McVV87T"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-600 transition-colors"
                  >
                    LINE: @308mstvl
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <a href="mailto:caishenmaixie@gmail.com" className="break-all hover:text-blue-600 transition-colors">caishenmaixie@gmail.com</a>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} className="sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                  <span>24小時全年無休</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 服務保證橫幅 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield size={20} />
              <span>100%正品保證</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={20} />
              <span>安全交易</span>
            </div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon size={20} />
              <span>7天鑑賞期</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={20} />
              <span>快速配送</span>
            </div>
          </div>
        </div>
      </div>

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