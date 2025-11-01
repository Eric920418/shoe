'use client'

/**
 * 後台新增產品頁面
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_PRODUCT, GET_BRANDS, GET_CATEGORIES, GET_PRODUCTS } from '@/graphql/queries'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/admin/ImageUpload'

interface ProductFormData {
  name: string
  slug: string
  description: string
  images: string[]
  categoryId: string
  brandId: string
  price: number | ''
  originalPrice: number | ''
  stock: number | ''
  status: string
  isFeatured: boolean
  isNewArrival: boolean
  shoeType: string
  gender: string
  season: string
  heelHeight: number | ''
  closure: string
  sole: string
  features: string[]
}

const initialFormData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  images: [],
  categoryId: '',
  brandId: '',
  price: '',
  originalPrice: '',
  stock: '',
  status: 'DRAFT',
  isFeatured: false,
  isNewArrival: false,
  shoeType: '',
  gender: '',
  season: '',
  heelHeight: '',
  closure: '',
  sole: '',
  features: [],
}

// 可選的鞋子特性
const availableFeatures = [
  '防水',
  '透氣',
  '防滑',
  '減震',
  '輕量',
  '耐磨',
  '抗菌',
  '快乾',
]

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 獲取品牌列表
  const { data: brandsData, loading: brandsLoading, error: brandsError } = useQuery(GET_BRANDS)
  // 獲取分類列表
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery(GET_CATEGORIES)

  const [createProduct] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [
      { query: GET_PRODUCTS },
      { query: GET_BRANDS },
      { query: GET_CATEGORIES },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('產品創建成功！')
      router.push('/admin/products')
    },
    onError: (error) => {
      console.error('創建產品失敗:', error)
      toast.error(error.message || '創建產品失敗，請重試')
      setIsSubmitting(false)
    },
  })

  // 更新表單欄位
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 根據名稱自動生成slug
  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    updateField('slug', slug)
  }

  // 切換特性選擇
  const toggleFeature = (feature: string) => {
    const newFeatures = formData.features.includes(feature)
      ? formData.features.filter((f) => f !== feature)
      : [...formData.features, feature]
    updateField('features', newFeatures)
  }

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = '請輸入產品名稱'
    // slug 改為選填，後端會自動生成
    if (!formData.categoryId) newErrors.categoryId = '請選擇分類'
    if (!formData.brandId) newErrors.brandId = '請選擇品牌'
    if (formData.price === '' || formData.price <= 0)
      newErrors.price = '請輸入有效的價格'
    if (formData.stock === '' || formData.stock < 0)
      newErrors.stock = '請輸入有效的庫存'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('請檢查表單錯誤')
      return
    }

    setIsSubmitting(true)

    try {
      // 準備 GraphQL 輸入數據
      const input = {
        name: formData.name,
        slug: formData.slug.trim() || undefined, // 只在有值時傳入 slug，否則讓後端自動生成
        description: formData.description,
        categoryId: formData.categoryId,
        brandId: formData.brandId || null,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: Number(formData.stock),
        images: formData.images,
        isActive: formData.status === 'ACTIVE',
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        shoeType: formData.shoeType || null,
        gender: formData.gender || null,
        season: formData.season || null,
        heelHeight: formData.heelHeight ? Number(formData.heelHeight) : null,
        closure: formData.closure || null,
        sole: formData.sole || null,
        features: formData.features,
      }

      await createProduct({ variables: { input } })
    } catch (error: any) {
      console.error('創建產品失敗:', error)
      // 顯示完整錯誤訊息（根據全局設定要求）
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message || '創建產品失敗，請重試'
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新增產品</h1>
          <p className="text-gray-600 mt-1">新增產品到您的商店</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          返回列表
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 圖片上傳 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">產品圖片</h2>
          <ImageUpload
            images={formData.images}
            onChange={(images) => updateField('images', images)}
            maxImages={8}
          />
        </div>

        {/* 基本資訊 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 產品名稱 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                產品名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  updateField('name', e.target.value)
                  if (!formData.slug) generateSlug(e.target.value)
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如：Nike Air Max 270"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                系統會自動生成 URL 網址（例如：/products/nike-air-max-270）
              </p>
            </div>

            {/* 產品描述 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                產品描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="詳細描述產品的特點、材質、設計等..."
              />
            </div>
          </div>
        </div>

        {/* 分類和品牌 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分類和品牌</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 分類 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分類 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                disabled={categoriesLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {categoriesLoading ? '載入中...' : categoriesError ? '載入失敗' : '請選擇分類'}
                </option>
                {categoriesData?.categories?.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.productCount > 0 ? `(${category.productCount})` : ''}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>
              )}
              {categoriesError && (
                <p className="text-sm text-red-600 mt-1">無法載入分類列表：{categoriesError.message}</p>
              )}
            </div>

            {/* 品牌 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                品牌 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => updateField('brandId', e.target.value)}
                disabled={brandsLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.brandId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {brandsLoading ? '載入中...' : brandsError ? '載入失敗' : '請選擇品牌'}
                </option>
                {brandsData?.brands?.map((brand: any) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} {brand.productCount > 0 ? `(${brand.productCount})` : ''}
                  </option>
                ))}
              </select>
              {errors.brandId && (
                <p className="text-sm text-red-600 mt-1">{errors.brandId}</p>
              )}
              {brandsError && (
                <p className="text-sm text-red-600 mt-1">無法載入品牌列表：{brandsError.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 價格和庫存 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">價格和庫存</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 售價 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                售價 (NT$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  updateField('price', e.target.value ? Number(e.target.value) : '')
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="4500"
                min="0"
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price}</p>
              )}
            </div>

            {/* 原價 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                原價 (NT$)
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) =>
                  updateField('originalPrice', e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">用於顯示折扣</p>
            </div>

            {/* 庫存 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                總庫存 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  updateField('stock', e.target.value ? Number(e.target.value) : '')
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100"
                min="0"
              />
              {errors.stock && (
                <p className="text-sm text-red-600 mt-1">{errors.stock}</p>
              )}
            </div>
          </div>
        </div>

        {/* 鞋子專屬資訊 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">鞋子專屬資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 鞋型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                鞋型
              </label>
              <select
                value={formData.shoeType}
                onChange={(e) => updateField('shoeType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">請選擇鞋型</option>
                <option value="運動鞋">運動鞋</option>
                <option value="跑步鞋">跑步鞋</option>
                <option value="籃球鞋">籃球鞋</option>
                <option value="皮鞋">皮鞋</option>
                <option value="休閒鞋">休閒鞋</option>
                <option value="涼鞋">涼鞋</option>
                <option value="靴子">靴子</option>
                <option value="拖鞋">拖鞋</option>
              </select>
            </div>

            {/* 性別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                性別
              </label>
              <select
                value={formData.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">請選擇性別</option>
                <option value="MEN">男款</option>
                <option value="WOMEN">女款</option>
                <option value="UNISEX">中性</option>
                <option value="KIDS">童款</option>
              </select>
            </div>

            {/* 季節 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                適用季節
              </label>
              <select
                value={formData.season}
                onChange={(e) => updateField('season', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">請選擇季節</option>
                <option value="春夏">春夏</option>
                <option value="秋冬">秋冬</option>
                <option value="四季">四季</option>
              </select>
            </div>

            {/* 鞋跟高度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                鞋跟高度 (cm)
              </label>
              <input
                type="number"
                value={formData.heelHeight}
                onChange={(e) =>
                  updateField('heelHeight', e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="2.5"
                step="0.1"
                min="0"
              />
            </div>

            {/* 閉合方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                閉合方式
              </label>
              <select
                value={formData.closure}
                onChange={(e) => updateField('closure', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">請選擇閉合方式</option>
                <option value="系帶">系帶</option>
                <option value="魔術貼">魔術貼</option>
                <option value="拉鍊">拉鍊</option>
                <option value="套腳">套腳</option>
                <option value="扣環">扣環</option>
              </select>
            </div>

            {/* 鞋底材質 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                鞋底材質
              </label>
              <input
                type="text"
                value={formData.sole}
                onChange={(e) => updateField('sole', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如：橡膠、EVA、PU"
              />
            </div>
          </div>

          {/* 產品特性 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              產品特性
            </label>
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-1 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.features.includes(feature)
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 狀態 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">產品狀態</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="DRAFT">草稿（不公開顯示）</option>
                <option value="ACTIVE">在售（公開顯示）</option>
                <option value="ARCHIVED">已下架</option>
              </select>
            </div>

            {/* 精選產品和新品展示 */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => updateField('isFeatured', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                  <span className="font-medium">精選產品</span>
                  <span className="text-gray-500 ml-2">（在首頁「精選推薦」區塊顯示）</span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNewArrival"
                  checked={formData.isNewArrival}
                  onChange={(e) => updateField('isNewArrival', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isNewArrival" className="ml-2 block text-sm text-gray-700">
                  <span className="font-medium">新品展示</span>
                  <span className="text-gray-500 ml-2">（在首頁「新品搶先體驗」區塊顯示）</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '創建中...' : '創建產品'}
          </button>
        </div>
      </form>
    </div>
  )
}
