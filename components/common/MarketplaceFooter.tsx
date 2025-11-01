'use client'

import React from 'react'
import Link from 'next/link'
import {
  Phone, Mail, Clock, Shield, CreditCard, Truck, HeadphonesIcon,
  Facebook, Instagram, Twitter, Youtube, MessageCircle
} from 'lucide-react'

const MarketplaceFooter = () => {
  const paymentMethods = ['信用卡', 'ATM', '超商代碼', '貨到付款', 'Line Pay']
  const shippingPartners = ['7-11', '全家', '宅配', '超商取貨']

  return (
    <footer className="bg-gray-100 mt-12">
      {/* 主要內容區 */}
      <div className="bg-white border-t-4 border-orange-500">
        <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
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
                    href="/payment-info"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    付款方式
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    運送方式
                  </Link>
                </li>
                <li>
                  <Link
                    href="/returns"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    退貨退款
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    聯絡我們
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
                    href="/news"
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

            {/* 關注我們 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">關注我們</h3>
              <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                <Link
                  href="#"
                  className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Facebook size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
                <Link
                  href="#"
                  className="bg-pink-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-pink-700 transition-colors"
                >
                  <Instagram size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
                <Link
                  href="#"
                  className="bg-blue-400 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-500 transition-colors"
                >
                  <Twitter size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
                <Link
                  href="#"
                  className="bg-red-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-700 transition-colors"
                >
                  <Youtube size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                門市地址：台中市自由路二段9號1樓
              </div>
            </div>

            {/* 客服資訊 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">客服資訊</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                  <span>0923101058</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle size={14} className="sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>LINE: @shoesale</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className="break-all">service@shoesale.tw</span>
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
              <Truck size={20} />
              <span>全台免運費</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={20} />
              <span>安全交易</span>
            </div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon size={20} />
              <span>7天鑑賞期</span>
            </div>
          </div>
        </div>
      </div>

    
    </footer>
  );
}

export default MarketplaceFooter