'use client'

/**
 * 後台編輯產品頁面
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client'
import {
  UPDATE_PRODUCT,
  GET_PRODUCT_BY_ID,
  GET_BRANDS,
  GET_CATEGORIES,
  GET_PRODUCTS,
  GET_PRODUCT_SIZE_CHARTS,
  CREATE_SIZE_CHART,
  UPDATE_SIZE_CHART,
  DELETE_SIZE_CHART,
  GET_ALL_PRODUCT_OPTIONS,
} from '@/graphql/queries'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/admin/ImageUpload'
import SizeManagement from '@/components/admin/SizeManagement'
import ColorManagement from '@/components/admin/ColorManagement'
import SkuMatrixManagement from '@/components/admin/SkuMatrixManagement'
import ProductOptionManager from '@/components/admin/ProductOptionManager'
import { Settings } from 'lucide-react'

interface ProductFormData {
  name: string
  slug: string
  description: string
  images: string[]
  categoryId: string
  brandId: string
  price: number | ''
  originalPrice: number | ''
  isFeatured: boolean
  isNewArrival: boolean
  shoeType: string
  gender: string
  season: string
  heelHeight: number | ''
  closure: string
  sole: string
  features: string[]
  // 數量限制與包裝設定
  maxQuantityPerOrder: number | ''
  maxCombinedQuantity: number | ''
  canCombinePackaging: boolean
  packagingVolume: string
  minPackagingUnits: number | ''
}

interface ProductOption {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [activeTab, setActiveTab] = useState<'info' | 'sizes' | 'colors' | 'stock'>('info')
  const [formData, setFormData] = useState<ProductFormData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 選項管理彈窗狀態
  const [showShoeTypeManager, setShowShoeTypeManager] = useState(false)
  const [showClosureManager, setShowClosureManager] = useState(false)
  const [showFeatureManager, setShowFeatureManager] = useState(false)

  // 獲取產品數據
  const { data: productData, loading: productLoading, error: productError } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { id: productId },
    onCompleted: (data) => {
      if (data?.product) {
        // 確保 images 和 features 始終是陣列
        const images = Array.isArray(data.product.images) ? data.product.images : []
        const features = Array.isArray(data.product.features) ? data.product.features : []

        setFormData({
          name: data.product.name || '',
          slug: data.product.slug || '',
          description: data.product.description || '',
          images,
          categoryId: data.product.category?.id || '',
          brandId: data.product.brand?.id || '',
          price: data.product.price || '',
          originalPrice: data.product.originalPrice || '',
          isFeatured: data.product.isFeatured || false,
          isNewArrival: data.product.isNewArrival || false,
          shoeType: data.product.shoeType || '',
          gender: data.product.gender || '',
          season: data.product.season || '',
          heelHeight: data.product.heelHeight || '',
          closure: data.product.closure || '',
          sole: data.product.sole || '',
          features,
          // 數量限制與包裝設定
          maxQuantityPerOrder: data.product.maxQuantityPerOrder || 10,
          maxCombinedQuantity: data.product.maxCombinedQuantity || 3,
          canCombinePackaging: data.product.canCombinePackaging ?? true,
          packagingVolume: data.product.packagingVolume || 'STANDARD',
          minPackagingUnits: data.product.minPackagingUnits || 1,
        })
      }
    },
    onError: (error) => {
      console.error('載入產品失敗:', error)
      toast.error(`載入產品失敗：${error.message}`)
    },
  })

  // 獲取品牌列表
  const { data: brandsData, loading: brandsLoading, error: brandsError } = useQuery(GET_BRANDS)
  // 獲取分類列表
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery(GET_CATEGORIES)
  // 獲取產品選項（鞋型、閉合方式、產品特性）
  const { data: optionsData, loading: optionsLoading, refetch: refetchOptions } = useQuery(GET_ALL_PRODUCT_OPTIONS)

  // 從 API 獲取的選項
  const shoeTypeOptions: ProductOption[] = optionsData?.shoeTypeOptions || []
  const closureOptions: ProductOption[] = optionsData?.closureOptions || []
  const featureOptions: ProductOption[] = optionsData?.featureOptions || []

  // 更新產品 Mutation
  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [
      { query: GET_PRODUCTS },
      { query: GET_BRANDS },
      { query: GET_CATEGORIES },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('產品更新成功！')
      router.push('/admin/products')
    },
    onError: (error) => {
      console.error('更新產品失敗:', error)
      toast.error(error.message || '更新產品失敗，請重試')
      setIsSubmitting(false)
    },
  })

  // 更新表單欄位
  const updateField = (field: keyof ProductFormData, value: any) => {
    if (!formData) return
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 切換特性選擇
  const toggleFeature = (feature: string) => {
    if (!formData) return
    const newFeatures = formData.features.includes(feature)
      ? formData.features.filter((f) => f !== feature)
      : [...formData.features, feature]
    updateField('features', newFeatures)
  }

  // 驗證表單
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    if (!formData) return { isValid: false, errors: { form: '表單資料不存在' } }
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = '請輸入產品名稱'
    // slug 改為選填，後端會自動生成
    if (!formData.categoryId) newErrors.categoryId = '請選擇分類'
    if (!formData.brandId) newErrors.brandId = '請選擇品牌'
    if (formData.price === '' || formData.price <= 0)
      newErrors.price = '請輸入有效的價格'
    // 移除庫存驗證，因為庫存由尺碼獨立管理

    setErrors(newErrors)
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateForm()

    if (!validation.isValid) {
      const errorFields = Object.keys(validation.errors).join('、')
      const errorMessages = Object.values(validation.errors).join('；')

      toast.error(`表單驗證失敗：${errorMessages}`)

      // 在 console 顯示詳細錯誤
      console.error('表單驗證錯誤:', validation.errors)
      console.error('表單資料:', formData)
      return
    }

    if (!formData) return

    setIsSubmitting(true)

    try {
      console.log('開始更新產品，ID:', productId)
      console.log('更新資料:', formData)

      // 準備 GraphQL 輸入數據
      const input = {
        name: formData.name,
        slug: formData.slug.trim() || undefined, // 只在有值時傳入 slug，否則讓後端自動生成
        description: formData.description,
        images: formData.images,
        categoryId: formData.categoryId,
        brandId: formData.brandId || null,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: 0, // 庫存由尺碼管理，此處固定為 0
        isActive: true, // 產品永遠在售
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        shoeType: formData.shoeType || null,
        gender: formData.gender || null,
        season: formData.season || null,
        heelHeight: formData.heelHeight ? Number(formData.heelHeight) : null,
        closure: formData.closure || null,
        sole: formData.sole || null,
        features: formData.features, // 添加產品特性欄位
        // 數量限制與包裝設定
        maxQuantityPerOrder: formData.maxQuantityPerOrder ? Number(formData.maxQuantityPerOrder) : 10,
        maxCombinedQuantity: formData.maxCombinedQuantity ? Number(formData.maxCombinedQuantity) : 3,
        canCombinePackaging: formData.canCombinePackaging,
        packagingVolume: formData.packagingVolume,
        minPackagingUnits: formData.minPackagingUnits ? Number(formData.minPackagingUnits) : 1,
      }

      console.log('GraphQL mutation input:', input)

      await updateProduct({ variables: { id: productId, input } })
    } catch (error: any) {
      console.error('更新產品失敗 - 完整錯誤:', error)
      console.error('GraphQL 錯誤:', error.graphQLErrors)
      console.error('網路錯誤:', error.networkError)

      // 提取最詳細的錯誤訊息
      let errorMessage = '更新產品失敗'

      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        // 顯示所有 GraphQL 錯誤
        const messages = error.graphQLErrors.map((err: any) => err.message).join('；')
        errorMessage = `GraphQL 錯誤：${messages}`
      } else if (error.networkError) {
        errorMessage = `網路錯誤：${error.networkError.message}`
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">載入中...</p>
        </div>
      </div>
    )
  }

  if (productError || !formData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{productError ? `載入失敗：${productError.message}` : '產品不存在'}</p>
        <Link
          href="/admin/products"
          className="text-primary-600 hover:text-primary-700 mt-4 inline-block"
        >
          返回產品列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">編輯產品</h1>
          <p className="text-gray-600 mt-1">修改產品資訊和管理尺碼</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          返回列表
        </Link>
      </div>

      {/* Tab 導航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            基本資訊
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sizes')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sizes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            尺碼管理
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'colors'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            顏色管理
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stock'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            庫存管理
          </button>
        </nav>
      </div>

      {/* Tab 內容 */}
      {activeTab === 'info' ? (
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                產品名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                系統會自動生成 URL 網址（例如：/products/nike-air-max-270）
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                產品描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 分類和品牌 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分類和品牌</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* 價格設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">價格設定</h2>
          <p className="text-sm text-gray-600 mb-4">
            庫存由各個尺碼獨立管理，請前往「尺碼管理」分頁設定各尺碼的庫存。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                min="0"
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price}</p>
              )}
            </div>

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
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">用於顯示折扣</p>
            </div>
          </div>
        </div>

        {/* 鞋子專屬資訊 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">鞋子專屬資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  鞋型
                </label>
                <button
                  type="button"
                  onClick={() => setShowShoeTypeManager(!showShoeTypeManager)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  管理選項
                </button>
              </div>
              <select
                value={formData.shoeType}
                onChange={(e) => updateField('shoeType', e.target.value)}
                disabled={optionsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{optionsLoading ? '載入中...' : '請選擇鞋型'}</option>
                {shoeTypeOptions.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              {showShoeTypeManager && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <ProductOptionManager
                    type="SHOE_TYPE"
                    options={shoeTypeOptions}
                    onOptionCreated={() => refetchOptions()}
                    onOptionUpdated={() => refetchOptions()}
                    onOptionDeleted={() => refetchOptions()}
                  />
                </div>
              )}
            </div>

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
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  閉合方式
                </label>
                <button
                  type="button"
                  onClick={() => setShowClosureManager(!showClosureManager)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  管理選項
                </button>
              </div>
              <select
                value={formData.closure}
                onChange={(e) => updateField('closure', e.target.value)}
                disabled={optionsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{optionsLoading ? '載入中...' : '請選擇閉合方式'}</option>
                {closureOptions.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              {showClosureManager && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <ProductOptionManager
                    type="CLOSURE"
                    options={closureOptions}
                    onOptionCreated={() => refetchOptions()}
                    onOptionUpdated={() => refetchOptions()}
                    onOptionDeleted={() => refetchOptions()}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                鞋底材質
              </label>
              <input
                type="text"
                value={formData.sole}
                onChange={(e) => updateField('sole', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                產品特性
              </label>
              <button
                type="button"
                onClick={() => setShowFeatureManager(!showFeatureManager)}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                管理選項
              </button>
            </div>
            {showFeatureManager && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <ProductOptionManager
                  type="FEATURE"
                  options={featureOptions}
                  onOptionCreated={() => refetchOptions()}
                  onOptionUpdated={() => refetchOptions()}
                  onOptionDeleted={() => refetchOptions()}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {optionsLoading ? (
                <p className="text-sm text-gray-500">載入中...</p>
              ) : featureOptions.length === 0 ? (
                <p className="text-sm text-gray-500">尚無可選特性，請點擊「管理選項」新增</p>
              ) : (
                featureOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleFeature(option.name)}
                    className={`px-3 py-1 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.features.includes(option.name)
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 數量限制與包裝設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">數量限制與包裝設定</h2>
          <p className="text-sm text-gray-600 mb-4">
            設定單筆訂單的購買限制，以及與711超商取貨物流配送相關的包裝限制。
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  單筆訂單最多可購買數量
                </label>
                <input
                  type="number"
                  value={formData.maxQuantityPerOrder}
                  onChange={(e) => updateField('maxQuantityPerOrder', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">此產品單筆訂單最多可購買的數量</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  711取貨最大總數（與其他產品搭配）
                </label>
                <input
                  type="number"
                  value={formData.maxCombinedQuantity}
                  onChange={(e) => updateField('maxCombinedQuantity', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">使用711取貨時，此商品與其他商品搭配的最大總數</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  包裝體積大小
                </label>
                <select
                  value={formData.packagingVolume}
                  onChange={(e) => updateField('packagingVolume', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="SMALL">小型（如涼鞋、拖鞋）</option>
                  <option value="STANDARD">標準（一般運動鞋、休閒鞋）</option>
                  <option value="LARGE">大型（靴子、高筒鞋）</option>
                  <option value="OVERSIZED">超大（特殊款式）</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">影響物流配送限制的計算</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最小包裝單位（雙/盒）
                </label>
                <input
                  type="number"
                  value={formData.minPackagingUnits}
                  onChange={(e) => updateField('minPackagingUnits', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">每個包裝盒最少裝幾雙</p>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="canCombinePackaging"
                checked={formData.canCombinePackaging}
                onChange={(e) => updateField('canCombinePackaging', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="canCombinePackaging" className="ml-2 block text-sm text-gray-700">
                <span className="font-medium">允許合併包裝</span>
                <span className="text-gray-500 ml-2">（多雙可以裝在同一個盒子以減少體積）</span>
              </label>
            </div>
          </div>
        </div>

        {/* 展示設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">展示設定</h2>
          <p className="text-sm text-gray-600 mb-4">
            產品會自動維持「在售」狀態，並公開顯示在前台。
          </p>
          <div className="space-y-3">
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
            {isSubmitting ? '更新中...' : '更新產品'}
          </button>
        </div>
      </form>
      ) : activeTab === 'sizes' ? (
        <div className="space-y-6">
          <SizeManagement productId={productId} />
        </div>
      ) : activeTab === 'colors' ? (
        <div className="space-y-6">
          <ColorManagement productId={productId} />
        </div>
      ) : (
        <div className="space-y-6">
          <SkuMatrixManagement productId={productId} />
        </div>
      )}
    </div>
  )
}
