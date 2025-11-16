'use client'

import React from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import { RotateCcw, Package, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 麵包屑導航 */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <Link href="/" className="hover:text-orange-600 transition-colors">
                首頁
              </Link>
            </li>
            <li>/</li>
            <li className="text-orange-600 font-medium">退款政策</li>
          </ol>
        </nav>

        {/* 頁面內容 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">退換貨與退款政策</h1>
          </div>
          <p className="text-sm text-gray-600 mb-8">最後更新日期：2025年1月</p>

          {/* 重點摘要 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              退換貨保障
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              依據消費者保護法第19條規定，消費者享有商品到貨後<strong className="text-orange-600">7天猶豫期</strong>的權益（非試用期）。
              在此期間內，若您對商品不滿意，可申請退貨退款。
            </p>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-600">7天</div>
                <div className="text-xs text-gray-600">鑑賞期</div>
              </div>
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-600">100%</div>
                <div className="text-xs text-gray-600">退款保證</div>
              </div>
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-600">快速</div>
                <div className="text-xs text-gray-600">處理流程</div>
              </div>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1. 退貨條件 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                1. 退貨條件
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">符合以下條件的商品可接受退貨：</p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>商品收到後<strong>7天內</strong>提出退貨申請</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>商品<strong>未經使用、試穿或拆封</strong>，保持原包裝完整</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>商品<strong>標籤、吊牌完整</strong>未剪除</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>附贈品、配件、贈品等<strong>須一併退回</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>原廠包裝、外盒、說明書等<strong>齊全無損</strong></span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>注意：</strong>鞋類商品若已試穿，鞋底有磨損或使用痕跡，恕無法接受退貨。
                      建議您在室內乾淨地面試穿，確認尺寸合適後再使用。
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* 2. 不接受退貨的情況 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                2. 不接受退貨的情況
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>依據消費者保護法第19條及相關法規，以下情況<strong className="text-red-600">不適用</strong>7天鑑賞期：</p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>已拆封使用的商品（鞋底有明顯磨損或污損）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>標籤、吊牌已剪除或遺失</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>原廠包裝、外盒嚴重損毀</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>客製化商品（依您需求特別訂製者）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>特價或出清商品（除瑕疵品外）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>超過7天鑑賞期</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>商品有人為損壞、髒污或異味</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. 退貨流程 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-orange-600" />
                3. 退貨流程
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 1：提出申請</p>
                  <p className="text-sm">
                    於商品到貨後7天內，透過以下方式聯繫客服提出退貨申請：
                  </p>
                  <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                    <li>客服電話：0923-101-058</li>
                    <li>LINE 客服：@308mstvl</li>
                    <li>線上客服系統（會員登入後）</li>
                    <li>Email：caishenmaixie@gmail.com</li>
                  </ul>
                  <p className="text-sm mt-2">
                    請提供：訂單編號、商品名稱、退貨原因
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 2：客服審核</p>
                  <p className="text-sm">
                    客服人員將於<strong>1個工作天內</strong>審核您的退貨申請，
                    並提供退貨地址或安排物流收件。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 3：寄回商品</p>
                  <p className="text-sm mb-2">請將商品妥善包裝後寄回：</p>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li><strong>宅配/超商取貨：</strong>我們將安排物流到府收件（免運費）</li>
                    <li><strong>自行寄回：</strong>寄至指定地址（運費需自付，退款時可扣除）</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 4：商品檢驗</p>
                  <p className="text-sm">
                    收到退貨商品後，我們將進行檢驗，確認符合退貨條件。
                    檢驗時間約<strong>1-2個工作天</strong>。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 5：退款處理</p>
                  <p className="text-sm">
                    檢驗通過後，將於<strong>3-7個工作天內</strong>完成退款。
                    退款方式依原付款方式而定（詳見下方說明）。
                  </p>
                </div>
              </div>
            </section>

            {/* 4. 退款方式與時間 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 退款方式與時間</h2>
              <div className="space-y-3 text-gray-700">
                <p>退款將依您的<strong>原付款方式</strong>進行：</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">信用卡付款</p>
                    <ul className="text-sm space-y-1">
                      <li>• 退款至原信用卡</li>
                      <li>• 約5-14個工作天入帳</li>
                      <li>• 依各銀行作業時間而定</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">ATM 轉帳</p>
                    <ul className="text-sm space-y-1">
                      <li>• 需提供退款帳戶資訊</li>
                      <li>• 約3-5個工作天入帳</li>
                      <li>• 匯款手續費由本公司負擔</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">超商代碼繳費</p>
                    <ul className="text-sm space-y-1">
                      <li>• 需提供退款帳戶資訊</li>
                      <li>• 約3-5個工作天入帳</li>
                      <li>• 匯款手續費由本公司負擔</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">貨到付款</p>
                    <ul className="text-sm space-y-1">
                      <li>• 需提供退款帳戶資訊</li>
                      <li>• 約3-5個工作天入帳</li>
                      <li>• 匯款手續費由本公司負擔</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">LINE Pay</p>
                    <ul className="text-sm space-y-1">
                      <li>• 退款至原 LINE Pay 帳戶</li>
                      <li>• 約3-7個工作天入帳</li>
                      <li>• 可於 LINE Pay 查看退款紀錄</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">購物金折抵</p>
                    <ul className="text-sm space-y-1">
                      <li>• 已使用的購物金將退回帳戶</li>
                      <li>• 立即生效</li>
                      <li>• 有效期限依原購物金規定</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. 換貨說明 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 換貨說明</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">5.1 可換貨情況</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>尺寸不合（需於7天內提出，且商品未使用）</li>
                  <li>顏色不符預期（需於7天內提出，且商品未使用）</li>
                  <li>商品瑕疵或品質問題</li>
                  <li>寄錯商品</li>
                </ul>

                <p className="font-semibold mt-4">5.2 換貨流程</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>聯繫客服說明換貨需求</li>
                  <li>確認有無庫存（若無庫存則改為退貨退款）</li>
                  <li>寄回原商品（流程同退貨）</li>
                  <li>收到商品並檢驗後，寄出新商品</li>
                </ol>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong>換貨運費：</strong>
                  </p>
                  <ul className="text-sm list-disc pl-6 mt-2 space-y-1">
                    <li>商品瑕疵或寄錯商品：由本公司負擔來回運費</li>
                    <li>尺寸/顏色不合：第一次換貨免運費，第二次起需自付運費</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. 瑕疵品處理 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 瑕疵品處理</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  若收到商品有瑕疵、損壞或品質問題，請於<strong>收到商品後7天內</strong>聯繫客服。
                </p>

                <p className="font-semibold">處理方式：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>拍照提供瑕疵照片給客服確認</li>
                  <li>客服確認後安排退換貨</li>
                  <li>來回運費由本公司負擔</li>
                  <li>優先安排換貨，若無庫存則全額退款</li>
                  <li>若造成不便，將提供購物金補償</li>
                </ul>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong>提醒：</strong>請於收到商品時立即檢查，若包裝外觀有明顯損壞，
                    建議當場拒收或拍照存證後聯繫客服。
                  </p>
                </div>
              </div>
            </section>

            {/* 7. 運費負擔說明 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 運費負擔說明</h2>
              <div className="space-y-3 text-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">退貨原因</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">運費負擔</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">商品瑕疵、損壞</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">本公司負擔</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">寄錯商品</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">本公司負擔</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">個人因素（尺寸不合、不喜歡等）</td>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">消費者負擔</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">換貨（第一次）</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">本公司負擔</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">換貨（第二次起）</td>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">消費者負擔</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 8. 常見問題 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 退換貨常見問題</h2>
              <div className="space-y-4 text-gray-700">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q1：可以試穿嗎？</p>
                  <p className="text-sm">
                    可以，但請在<strong>室內乾淨地面</strong>試穿。若鞋底有明顯磨損或髒污，將無法退貨。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q2：退款多久會入帳？</p>
                  <p className="text-sm">
                    依付款方式不同，約<strong>3-14個工作天</strong>。信用卡退款需依各銀行作業時間。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q3：可以只退部分商品嗎？</p>
                  <p className="text-sm">
                    可以。若訂單中有多項商品，可選擇退部分商品。但若原訂單有滿額優惠，
                    退貨後若不符合優惠條件，將調整退款金額。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q4：外盒有點損壞可以退嗎？</p>
                  <p className="text-sm">
                    若是運送過程造成的輕微損壞，不影響退貨權益。但若是人為嚴重破壞，
                    可能無法接受退貨。建議拍照聯繫客服確認。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q5：贈品要一起退回嗎？</p>
                  <p className="text-sm">
                    是的，所有贈品、配件都需一併退回，否則將從退款金額中扣除贈品價值。
                  </p>
                </div>
              </div>
            </section>

            {/* 聯絡資訊 */}
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">退換貨問題？聯絡我們</h3>
              <p className="text-gray-700 mb-4">
                若對退換貨有任何疑問，歡迎聯繫我們的客服團隊，我們將竭誠為您服務。
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">客服聯絡方式</p>
                  <p className="text-sm text-gray-700">電話：0923-101-058</p>
                  <p className="text-sm text-gray-700">LINE：@308mstvl</p>
                  <p className="text-sm text-gray-700">Email：caishenmaixie@gmail.com</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">服務時間</p>
                  <p className="text-sm text-gray-700">24小時全年無休</p>
                  <p className="text-sm text-gray-700 mt-2">
                    平均回覆時間：2小時內
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  )
}
