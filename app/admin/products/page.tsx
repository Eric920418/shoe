'use client'

/**
 * 後台產品管理頁面
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, useMutation } from '@apollo/client'
import { GET_PRODUCTS, GET_BRANDS, GET_CATEGORIES, DELETE_PRODUCT } from '@/graphql/queries'
import toast from 'react-hot-toast'

const statusLabels = {
  ACTIVE: { label: '在售', color: 'bg-green-100 text-green-700' },
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  OUT_OF_STOCK: { label: '缺貨', color: 'bg-red-100 text-red-700' },
  ARCHIVED: { label: '已下架', color: 'bg-yellow-100 text-yellow-700' },
}

const genderLabels = {
  MEN: '男款',
  WOMEN: '女款',
  UNISEX: '中性',
  KIDS: '童款',
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // 獲取產品列表
  const { data: productsData, loading: productsLoading, error: productsError, refetch } = useQuery(GET_PRODUCTS, {
    variables: {
      search: searchQuery || undefined,
      categoryId: filterCategory || undefined,
      brandId: filterBrand || undefined,
    },
    fetchPolicy: 'network-only', // 總是從網路獲取最新資料
    nextFetchPolicy: 'cache-first', // 後續查詢使用快取
  })

  // 獲取品牌列表（用於篩選）
  const { data: brandsData } = useQuery(GET_BRANDS, {
    fetchPolicy: 'cache-and-network', // 使用快取但也從網路更新
  })

  // 獲取分類列表（用於篩選）
  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    fetchPolicy: 'cache-and-network', // 使用快取但也從網路更新
  })

  // 刪除產品 Mutation
  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onCompleted: () => {
      toast.success('產品刪除成功！')
      refetch() // 刷新產品列表
    },
    onError: (error) => {
      console.error('刪除產品失敗:', error)
      toast.error(error.message || '刪除產品失敗，請重試')
    },
  })

  const products = productsData?.products || []

  // 計算統計數據
  const activeProducts = products.filter((p: any) => p.stock > 0)
  const outOfStockProducts = products.filter((p: any) => p.stock === 0)
  const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= 10)

  // 切換產品選擇
  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p: any) => p.id))
    }
  }

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) return
    if (!confirm(`確定要刪除選中的 ${selectedProducts.length} 個產品嗎？此操作不可撤銷。`)) {
      return
    }

    const promises = selectedProducts.map((id) => deleteProduct({ variables: { id } }))

    try {
      await Promise.all(promises)
      setSelectedProducts([])
    } catch (error) {
      console.error('批量刪除失敗:', error)
    }
  }

  // 刪除單個產品
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要刪除產品「${name}」嗎？此操作不可撤銷。`)) {
      return
    }

    try {
      await deleteProduct({ variables: { id } })
    } catch (error) {
      console.error('刪除產品失敗:', error)
    }
  }

  // 載入中狀態
  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">載入產品列表中...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (productsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">載入產品列表失敗：{productsError.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">產品管理</h1>
          <p className="text-gray-600 mt-1">
            管理您的產品庫存、價格和詳細資訊
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          + 新增產品
        </Link>
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜尋框 */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="搜尋產品名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 品牌篩選 */}
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部品牌</option>
              {brandsData?.brands?.map((brand: any) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* 分類篩選 */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部分類</option>
              {categoriesData?.categories?.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            已選擇 {selectedProducts.length} 個產品
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              批量刪除
            </button>
            <button
              onClick={() => setSelectedProducts([])}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              取消選擇
            </button>
          </div>
        </div>
      )}

      {/* 產品表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 &&
                      selectedProducts.length === products.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  產品
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  分類
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  價格
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  庫存
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery || filterCategory || filterBrand
                      ? '沒有符合條件的產品'
                      : '暫無產品數據，請先新增產品'}
                  </td>
                </tr>
              ) : (
                products.map((product: any) => {
                  // 處理 images 欄位（可能是 JSON 字串、陣列或空）
                  let images: string[] = []
                  if (product.images) {
                    if (typeof product.images === 'string') {
                      try {
                        images = JSON.parse(product.images)
                      } catch {
                        images = []
                      }
                    } else if (Array.isArray(product.images)) {
                      images = product.images
                    }
                  }
                  const firstImage = images[0] || '/images/placeholder-product.svg'
                  const status = product.stock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={firstImage}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              {product.brand?.name} {product.gender && `· ${genderLabels[product.gender as keyof typeof genderLabels]}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            ${product.price.toLocaleString()}
                          </p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-xs text-gray-500 line-through">
                              ${product.originalPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-sm font-medium ${
                            product.stock === 0
                              ? 'text-red-600'
                              : product.stock <= 10
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}
                        >
                          {product.stock} 件
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            statusLabels[status as keyof typeof statusLabels].color
                          }`}
                        >
                          {statusLabels[status as keyof typeof statusLabels].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            title="查看前台展示"
                          >
                            查看
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            編輯
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {products.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {products.length} 個產品
            </div>
          </div>
        )}
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">總產品數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {products.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">在售產品</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {activeProducts.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">缺貨產品</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {outOfStockProducts.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">低庫存警告</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {lowStockProducts.length}
          </p>
        </div>
      </div>
    </div>
  )
}
