'use client'

import React from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import {
  ShoppingCart, CreditCard, Truck, Gift, Tag, Shield,
  CheckCircle, Info, AlertCircle, Star
} from 'lucide-react'

export default function ShoppingGuidePage() {
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
            <li className="text-orange-600 font-medium">購物須知</li>
          </ol>
        </nav>

        {/* 頁面內容 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">購物須知</h1>
          </div>
          <p className="text-sm text-gray-600 mb-8">最後更新日期：2025年1月</p>

          {/* 歡迎訊息 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-600" />
              歡迎來到財神賣鞋
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              感謝您選擇財神賣鞋！為了讓您有更好的購物體驗，請詳閱以下購物須知。
              若有任何疑問，歡迎隨時聯繫我們的客服團隊。
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1. 會員註冊與登入 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-orange-600" />
                1. 會員註冊與登入
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">1.1 成為會員的好處</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-sm">會員專屬優惠</p>
                    <p className="text-xs text-gray-600">享有會員限定折扣與活動</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-sm">購物金回饋</p>
                    <p className="text-xs text-gray-600">消費累積購物金，下次折抵</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-sm">會員升級制度</p>
                    <p className="text-xs text-gray-600">消費越多，等級越高，優惠越多</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-sm">訂單追蹤</p>
                    <p className="text-xs text-gray-600">隨時查看訂單與配送狀態</p>
                  </div>
                </div>

                <p className="font-semibold mt-4">1.2 會員等級制度</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">會員等級</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">累計消費</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">主要權益</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">銅牌會員</td>
                        <td className="border border-gray-300 px-4 py-2">$0 - $9,999</td>
                        <td className="border border-gray-300 px-4 py-2">基本會員優惠</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">銀牌會員</td>
                        <td className="border border-gray-300 px-4 py-2">$10,000 - $49,999</td>
                        <td className="border border-gray-300 px-4 py-2">額外5%購物金回饋</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">金牌會員</td>
                        <td className="border border-gray-300 px-4 py-2">$50,000 - $99,999</td>
                        <td className="border border-gray-300 px-4 py-2">額外10%購物金回饋</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">白金會員</td>
                        <td className="border border-gray-300 px-4 py-2">$100,000 - $199,999</td>
                        <td className="border border-gray-300 px-4 py-2">額外15%購物金回饋 + 專屬客服</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">鑽石會員</td>
                        <td className="border border-gray-300 px-4 py-2">$200,000+</td>
                        <td className="border border-gray-300 px-4 py-2">額外20%購物金回饋 + VIP禮遇</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 2. 如何購物 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
                2. 如何購物
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 1：瀏覽商品</p>
                  <p className="text-sm">
                    透過分類、品牌、搜尋功能找到您喜歡的商品。可查看商品圖片、詳細資訊、尺碼表等。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 2：選擇規格</p>
                  <p className="text-sm">
                    選擇顏色、尺碼及數量，確認庫存充足後加入購物車。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 3：查看購物車</p>
                  <p className="text-sm">
                    檢查購物車內容，可調整數量或刪除商品。確認無誤後點擊「前往結帳」。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 4：填寫資料</p>
                  <p className="text-sm">
                    填寫或選擇收貨地址、聯絡資訊。會員可使用已儲存的地址。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 5：選擇付款與配送</p>
                  <p className="text-sm">
                    選擇付款方式（信用卡/ATM/超商代碼/貨到付款/LINE Pay）及配送方式（宅配/超商取貨）。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 6：使用優惠</p>
                  <p className="text-sm">
                    輸入優惠券代碼或選擇使用購物金折抵。系統會自動計算折扣後金額。
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-orange-600 mb-2">步驟 7：完成訂單</p>
                  <p className="text-sm">
                    確認訂單資訊無誤後送出。您將收到訂單確認信，並可在會員中心查看訂單狀態。
                  </p>
                </div>
              </div>
            </section>

            {/* 3. 付款方式 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-orange-600" />
                3. 付款方式
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">信用卡線上刷卡</p>
                    <ul className="text-sm space-y-1">
                      <li>• 接受 VISA、MasterCard、JCB</li>
                      <li>• 付款後立即確認訂單</li>
                      <li>• 採用 SSL 加密保護交易安全</li>
                      <li>• 可分期付款（依銀行規定）</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">ATM 虛擬帳號轉帳</p>
                    <ul className="text-sm space-y-1">
                      <li>• 系統自動產生專屬虛擬帳號</li>
                      <li>• 3天內完成轉帳</li>
                      <li>• 轉帳後自動對帳，無需回報</li>
                      <li>• 逾期未付款訂單將自動取消</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">超商代碼繳費</p>
                    <ul className="text-sm space-y-1">
                      <li>• 至 7-11、全家、萊爾富繳費</li>
                      <li>• 系統提供繳費代碼</li>
                      <li>• 3天內完成繳費</li>
                      <li>• 單筆最高 $20,000</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">貨到付款</p>
                    <ul className="text-sm space-y-1">
                      <li>• 收到商品時現金付款</li>
                      <li>• 需額外支付手續費 $60</li>
                      <li>• 僅限宅配到府</li>
                      <li>• 請備妥零錢</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold mb-2">LINE Pay</p>
                    <ul className="text-sm space-y-1">
                      <li>• 使用 LINE Pay 行動支付</li>
                      <li>• 付款後立即確認訂單</li>
                      <li>• 享 LINE Points 回饋</li>
                      <li>• 安全便利</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>安全提醒：</strong>我們不會儲存您的完整信用卡號碼。
                      所有交易均透過第三方金流平台加密處理，請放心使用。
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* 4. 配送方式與運費 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-6 h-6 text-orange-600" />
                4. 配送方式與運費
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">配送方式</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">配送時間</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">運費</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">宅配到府</td>
                        <td className="border border-gray-300 px-4 py-2">3-5個工作天</td>
                        <td className="border border-gray-300 px-4 py-2">$100<br/><span className="text-green-600 text-xs">滿$1,000免運</span></td>
                        <td className="border border-gray-300 px-4 py-2">配送至指定地址</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">7-11 取貨</td>
                        <td className="border border-gray-300 px-4 py-2">2-3個工作天</td>
                        <td className="border border-gray-300 px-4 py-2">$60<br/><span className="text-green-600 text-xs">滿$800免運</span></td>
                        <td className="border border-gray-300 px-4 py-2">到店取貨付款</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">全家取貨</td>
                        <td className="border border-gray-300 px-4 py-2">2-3個工作天</td>
                        <td className="border border-gray-300 px-4 py-2">$60<br/><span className="text-green-600 text-xs">滿$800免運</span></td>
                        <td className="border border-gray-300 px-4 py-2">到店取貨付款</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">門市自取</td>
                        <td className="border border-gray-300 px-4 py-2">1-2個工作天</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">免運費</td>
                        <td className="border border-gray-300 px-4 py-2">需預約取貨時間</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>注意事項：</strong>
                    </span>
                  </p>
                  <ul className="text-sm list-disc pl-6 mt-2 space-y-1">
                    <li>超商取貨單件限重5公斤、限材積45x30x30公分</li>
                    <li>離島地區運費另計，請聯繫客服確認</li>
                    <li>配送時間不含例假日及國定假日</li>
                    <li>天災等不可抗力因素可能影響配送時間</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. 購物金與優惠券 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="w-6 h-6 text-orange-600" />
                5. 購物金與優惠券
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">5.1 購物金</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>獲得方式：</strong>消費回饋、活動贈送、生日禮、評價獎勵、會員升級等</li>
                  <li><strong>使用方式：</strong>結帳時選擇使用，系統自動折抵</li>
                  <li><strong>使用限制：</strong>每筆購物金有使用期限、最低訂單金額及單筆最大使用額限制</li>
                  <li><strong>有效期限：</strong>依各筆購物金規定，可於會員中心查看</li>
                </ul>

                <p className="font-semibold mt-4">5.2 優惠券</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>類型：</strong>百分比折扣、固定金額折扣、免運券、買X送Y</li>
                  <li><strong>獲得方式：</strong>活動領取、系統發放、首購禮等</li>
                  <li><strong>使用方式：</strong>結帳時輸入優惠碼或從清單選擇</li>
                  <li><strong>使用限制：</strong>每張優惠券有使用條件，詳見優惠券說明</li>
                  <li><strong>重要提醒：</strong>每筆訂單限用一張優惠券，不得與其他優惠併用（除非特別說明）</li>
                </ul>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong>小技巧：</strong>結帳前先查看可用的購物金和優惠券，
                    系統會自動推薦最划算的組合方式！
                  </p>
                </div>
              </div>
            </section>

            {/* 6. 訂單查詢與追蹤 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 訂單查詢與追蹤</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">會員訂單查詢：</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>登入會員帳號</li>
                  <li>進入「我的訂單」頁面</li>
                  <li>查看所有訂單狀態與明細</li>
                  <li>點擊訂單可查看詳細資訊及物流追蹤號碼</li>
                </ol>

                <p className="font-semibold mt-4">訂單狀態說明：</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">待付款</p>
                      <p className="text-xs text-gray-600">等待您完成付款</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">處理中</p>
                      <p className="text-xs text-gray-600">訂單正在處理，準備出貨</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">已出貨</p>
                      <p className="text-xs text-gray-600">商品已寄出，可追蹤物流</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">已完成</p>
                      <p className="text-xs text-gray-600">訂單已送達或取貨完成</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">已取消</p>
                      <p className="text-xs text-gray-600">訂單已取消或退款</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. 退換貨須知 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-orange-600" />
                7. 退換貨須知
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  我們提供<strong className="text-orange-600">7天鑑賞期</strong>退換貨服務。
                  詳細規定請參閱
                  <Link href="/refund-policy" className="text-orange-600 hover:text-orange-700 underline mx-1">
                    退款政策
                  </Link>
                  頁面。
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">快速退換貨要點：</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>商品到貨後7天內提出申請</li>
                    <li>商品保持未使用、未拆封狀態</li>
                    <li>標籤吊牌完整、原包裝齊全</li>
                    <li>聯繫客服安排退換貨</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 8. 常見問題 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 購物常見問題</h2>
              <div className="space-y-4 text-gray-700">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q1：如何確認我的訂單是否成立？</p>
                  <p className="text-sm">
                    訂單送出後，您會立即收到訂單確認信（請檢查垃圾郵件）。
                    也可登入會員中心查看訂單狀態。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q2：可以修改或取消訂單嗎？</p>
                  <p className="text-sm">
                    訂單確認後即進入處理流程。若需修改或取消，請立即聯繫客服。
                    若商品已出貨，則需依退貨流程處理。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q3：如何選擇正確的鞋子尺寸？</p>
                  <p className="text-sm">
                    每個商品頁面都有詳細的尺碼表（EUR/US/UK/CM對照）。
                    建議測量腳長後參考尺碼表選購。若不確定，可聯繫客服諮詢。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q4：商品什麼時候會到？</p>
                  <p className="text-sm">
                    一般商品約3-5個工作天（宅配）或2-3個工作天（超商取貨）。
                    實際配送時間視物流狀況而定，您可透過物流編號追蹤包裹。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Q5：收到商品有瑕疵怎麼辦？</p>
                  <p className="text-sm">
                    請於收貨後7天內拍照並聯繫客服。確認為瑕疵品後，
                    我們將立即安排換貨或退款，運費由本公司負擔。
                  </p>
                </div>
              </div>
            </section>

            {/* 9. 客服服務 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 客服服務</h2>
              <div className="space-y-3 text-gray-700">
                <p>我們提供多種客服管道，隨時為您服務：</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <p className="font-semibold mb-2">LINE 客服（推薦）</p>
                    <p className="text-sm mb-2">LINE ID: @308mstvl</p>
                    <a
                      href="https://lin.ee/McVV87T"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 underline"
                    >
                      點擊加入好友
                    </a>
                    <p className="text-xs text-gray-600 mt-2">最快速的回覆方式！</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="font-semibold mb-2">客服電話</p>
                    <p className="text-sm mb-2">0923-101-058</p>
                    <p className="text-xs text-gray-600">24小時全年無休</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="font-semibold mb-2">電子郵件</p>
                    <p className="text-sm mb-2">caishenmaixie@gmail.com</p>
                    <p className="text-xs text-gray-600">約2-4小時內回覆</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="font-semibold mb-2">線上客服系統</p>
                    <Link href="/account/support" className="text-sm text-orange-600 hover:text-orange-700 underline">
                      前往線上客服
                    </Link>
                    <p className="text-xs text-gray-600 mt-2">需登入會員</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 聯絡資訊 */}
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">還有其他問題？</h3>
              <p className="text-gray-700 mb-4">
                我們的客服團隊隨時準備協助您！無論是購物流程、商品諮詢或任何疑問，歡迎隨時聯繫。
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">客服專線</p>
                  <p className="text-orange-600 text-lg">0923-101-058</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">LINE 客服</p>
                  <p className="text-green-600 text-lg">@308mstvl</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">服務時間</p>
                  <p className="text-gray-700 text-lg">24/7 全年無休</p>
                </div>
              </div>
            </section>

            {/* 相關連結 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">相關政策與條款</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/terms"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <p className="font-semibold text-gray-900">服務條款</p>
                  <p className="text-sm text-gray-600 mt-1">了解使用本平台的相關規定</p>
                </Link>

                <Link
                  href="/privacy"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <p className="font-semibold text-gray-900">隱私權政策</p>
                  <p className="text-sm text-gray-600 mt-1">我們如何保護您的個人資料</p>
                </Link>

                <Link
                  href="/refund-policy"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <p className="font-semibold text-gray-900">退款政策</p>
                  <p className="text-sm text-gray-600 mt-1">退換貨流程與相關規定</p>
                </Link>

                <Link
                  href="/contact"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <p className="font-semibold text-gray-900">聯絡我們</p>
                  <p className="text-sm text-gray-600 mt-1">各種聯絡方式與客服資訊</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  )
}
