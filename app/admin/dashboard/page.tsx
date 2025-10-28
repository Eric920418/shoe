/**
 * 後台儀表板
 */

export default function DashboardPage() {
  // TODO: 從 API 獲取統計數據
  const stats = {
    totalOrders: 156,
    totalRevenue: 123456,
    totalProducts: 89,
    totalUsers: 234,
    ordersToday: 12,
    revenueToday: 8900,
    pendingOrders: 8,
    lowStockProducts: 5,
  }

  const recentOrders = [
    { id: '1', orderNumber: 'ORD-001', customer: '王小明', total: 899, status: 'PENDING' },
    { id: '2', orderNumber: 'ORD-002', customer: '李大華', total: 1299, status: 'PAID' },
    { id: '3', orderNumber: 'ORD-003', customer: '張三', total: 599, status: 'SHIPPED' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">儀表板</h1>
        <p className="text-gray-600 mt-1">歡迎回來！這是您的業務概覽</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 總訂單數 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總訂單數</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              <p className="text-sm text-green-600 mt-2">今日 +{stats.ordersToday}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        {/* 總營業額 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總營業額</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2">
                今日 +${stats.revenueToday.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* 總產品數 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總產品數</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              <p className="text-sm text-orange-600 mt-2">{stats.lowStockProducts} 低庫存</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👟</span>
            </div>
          </div>
        </div>

        {/* 總用戶數 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總用戶數</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-2">活躍用戶</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* 待處理事項 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近訂單 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">最近訂單</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : order.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status === 'PENDING' && '待處理'}
                      {order.status === 'PAID' && '已付款'}
                      {order.status === 'SHIPPED' && '已發貨'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看所有訂單 →
            </button>
          </div>
        </div>

        {/* 待辦事項 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">待辦事項</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-red-900">{stats.pendingOrders} 個待處理訂單</p>
                  <p className="text-sm text-red-700">需要儘快處理</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-2xl">📉</span>
                <div>
                  <p className="font-medium text-orange-900">
                    {stats.lowStockProducts} 個產品庫存不足
                  </p>
                  <p className="text-sm text-orange-700">建議補貨</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium text-blue-900">3 條新評論待審核</p>
                  <p className="text-sm text-blue-700">需要審核</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
            <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">
              ➕
            </span>
            <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">
              新增產品
            </p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
            <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">
              🎫
            </span>
            <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">
              創建優惠券
            </p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
            <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">
              📊
            </span>
            <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">
              查看報表
            </p>
          </button>

        
        </div>
      </div>
    </div>
  )
}
