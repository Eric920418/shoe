'use client'

import React from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import { Phone, Mail, Clock, MessageCircle, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 麵包屑導航 */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <Link href="/" className="hover:text-orange-600 transition-colors">
                首頁
              </Link>
            </li>
            <li>/</li>
            <li className="text-orange-600 font-medium">聯絡我們</li>
          </ol>
        </nav>

        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">聯絡我們</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我們很樂意為您服務！如有任何問題或需求，歡迎透過以下方式與我們聯繫
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 聯絡資訊 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">客服資訊</h2>

            <div className="space-y-6">
              {/* 電話 */}
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">客服電話</h3>
                  <a
                    href="tel:0923-101-058"
                    className="text-orange-600 hover:text-orange-700 transition-colors text-lg"
                  >
                    0923-101-058
                  </a>
                  <p className="text-sm text-gray-600 mt-1">週一至週日 24小時全年無休</p>
                </div>
              </div>

              {/* LINE */}
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">LINE 客服</h3>
                  <a
                    href="https://lin.ee/McVV87T"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 transition-colors text-lg"
                  >
                    @308mstvl
                  </a>
                  <p className="text-sm text-gray-600 mt-1">點擊加入好友，即時線上客服</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">電子郵件</h3>
                  <a
                    href="mailto:caishenmaixie@gmail.com"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    caishenmaixie@gmail.com
                  </a>
                  <p className="text-sm text-gray-600 mt-1">客服信箱，我們會盡快回覆</p>
                </div>
              </div>

              {/* 門市地址 */}
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">門市地址</h3>
                  <p className="text-gray-700">台中市自由路二段9號1樓</p>
                  <p className="text-sm text-gray-600 mt-1">歡迎蒞臨門市選購</p>
                </div>
              </div>

              {/* 服務時間 */}
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">服務時間</h3>
                  <p className="text-gray-700">24小時全年無休</p>
                  <p className="text-sm text-gray-600 mt-1">隨時為您服務</p>
                </div>
              </div>
            </div>
          </div>

          {/* 常見問題快速連結 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">常見問題</h2>

            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                在聯絡我們之前，您可以先查看以下常見問題，可能會找到您需要的答案：
              </p>

              <Link
                href="/help#payment"
                className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 mb-1">
                  付款方式
                </h3>
                <p className="text-sm text-gray-600">
                  了解支援的付款方式與流程
                </p>
              </Link>

              <Link
                href="/help#shipping"
                className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 mb-1">
                  運送方式
                </h3>
                <p className="text-sm text-gray-600">
                  查看配送方式與運費說明
                </p>
              </Link>

              <Link
                href="/refund-policy"
                className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 mb-1">
                  退款政策
                </h3>
                <p className="text-sm text-gray-600">
                  了解退貨退款的相關規定
                </p>
              </Link>

              <Link
                href="/account/support"
                className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 mb-1">
                  線上客服系統
                </h3>
                <p className="text-sm text-gray-600">
                  登入後使用線上客服留言功能
                </p>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-orange-600">提示：</strong>
                使用 LINE 客服可以獲得最快速的回覆！
              </p>
            </div>
          </div>
        </div>

        {/* 服務承諾 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">我們的服務承諾</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <p className="text-sm">全年無休客服支援</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">&lt; 2小時</div>
              <p className="text-sm">平均回覆時間</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <p className="text-sm">客戶滿意度目標</p>
            </div>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  )
}
