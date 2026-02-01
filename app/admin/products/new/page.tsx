'use client'

/**
 * 後台新增產品頁面
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_PRODUCT, GET_CATEGORIES, GET_PRODUCTS, GET_ALL_PRODUCT_OPTIONS } from '@/graphql/queries'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/admin/ImageUpload'
import ProductOptionManager from '@/components/admin/ProductOptionManager'
import { Settings } from 'lucide-react'

interface ProductFormData {
  name: string
  slug: string
  description: string
  images: string[]
  categoryId: string
  price: number | ''
  originalPrice: number | ''
  isFeatured: boolean
  isNewArrival: boolean
  shoeType: string
  genders: string[]
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


const initialFormData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  images: [],
  categoryId: '',
  price: '',
  originalPrice: '',
  isFeatured: false,
  isNewArrival: false,
  shoeType: '',
  genders: [],
  season: '',
  heelHeight: '',
  closure: '',
  sole: '',
  features: [],
  // 數量限制與包裝設定
  maxQuantityPerOrder: 10,
  maxCombinedQuantity: 3,
  canCombinePackaging: true,
  packagingVolume: 'STANDARD',
  minPackagingUnits: 1,
}

interface ProductOption {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 獲取分類列表
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery(GET_CATEGORIES)
  // 獲取產品選項（鞋型、閉合方式、產品特性）
  const { data: optionsData, loading: optionsLoading, refetch: refetchOptions } = useQuery(GET_ALL_PRODUCT_OPTIONS)

  // 從 API 獲取的選項
  const shoeTypeOptions: ProductOption[] = optionsData?.shoeTypeOptions || []
  const closureOptions: ProductOption[] = optionsData?.closureOptions || []
  const featureOptions: ProductOption[] = optionsData?.featureOptions || []

  // 選項管理彈窗狀態
  const [showShoeTypeManager, setShowShoeTypeManager] = useState(false)
  const [showClosureManager, setShowClosureManager] = useState(false)
  const [showFeatureManager, setShowFeatureManager] = useState(false)

  const [createProduct] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [
      { query: GET_PRODUCTS },
      { query: GET_CATEGORIES },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('產品創建成功！請到編輯頁面設定尺碼')
      router.push('/admin/products')
    },
    onError: (error) => {
      console.error('創建產品失敗 - 完整錯誤:', error)

      // 嘗試提取最詳細的錯誤訊息
      let errorMessage = '創建產品失敗，請重試'

      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        // GraphQL 錯誤（來自後端）
        errorMessage = error.graphQLErrors[0].message
      } else if (error.networkError) {
        // 網路錯誤
        errorMessage = '網路連線失敗，請檢查網路狀態'
      } else if (error.message) {
        // 一般錯誤訊息
        errorMessage = error.message
      }

      toast.error(errorMessage, { duration: 5000 })
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

  // 切換性別選擇
  const toggleGender = (gender: string) => {
    const newGenders = formData.genders.includes(gender)
      ? formData.genders.filter((g) => g !== gender)
      : [...formData.genders, gender]
    updateField('genders', newGenders)
  }


  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必填欄位驗證
    if (!formData.name.trim()) {
      newErrors.name = '產品名稱為必填欄位'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '請選擇產品分類'
    }

    if (formData.price === '' || formData.price <= 0) {
      newErrors.price = '請輸入大於 0 的售價'
    }

    // 可選欄位的合理性驗證
    if (formData.originalPrice !== '' && formData.price !== '') {
      if (Number(formData.originalPrice) < Number(formData.price)) {
        newErrors.originalPrice = '原價不應低於售價'
      }
    }

    setErrors(newErrors)

    // 如果有錯誤，顯示錯誤摘要
    if (Object.keys(newErrors).length > 0) {
      const errorFields = Object.entries(newErrors).map(([field, message]) => {
        const fieldNames: Record<string, string> = {
          name: '產品名稱',
          categoryId: '分類',
          price: '售價',
          originalPrice: '原價',
        }
        return fieldNames[field] || field
      })
      toast.error(`請檢查以下欄位：${errorFields.join('、')}`)
    }

    return Object.keys(newErrors).length === 0
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 先驗證前端表單
    if (!validateForm()) {
      return // validateForm 已經顯示錯誤訊息了
    }

    setIsSubmitting(true)

    try {
      // 準備 GraphQL 輸入數據
      const input = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined, // 只在有值時傳入 slug，否則讓後端自動生成
        description: formData.description.trim() || null,
        categoryId: formData.categoryId,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: 0, // 庫存由尺碼管理，此處設為 0
        images: formData.images,
        isActive: true, // 新增產品自動設為在售狀態
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        shoeType: formData.shoeType || null,
        genders: formData.genders,
        season: formData.season || null,
        heelHeight: formData.heelHeight ? Number(formData.heelHeight) : null,
        closure: formData.closure || null,
        sole: formData.sole || null,
        features: formData.features,
      }

      await createProduct({ variables: { input } })
      // 成功處理由 onCompleted 處理
      // 錯誤處理由 onError 處理
    } catch (error: any) {
      // 這個 catch 區塊作為備用，通常錯誤會被 onError 捕獲
      console.error('創建產品失敗（備用錯誤處理）:', error)

      // 提取最詳細的錯誤訊息
      let errorMessage = '創建產品失敗，請重試'
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message
      } else if (error.networkError) {
        errorMessage = `網路錯誤: ${error.networkError.message || '無法連線到伺服器'}`
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage, { duration: 5000 })
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
        {/* 圖片/影片上傳 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">產品圖片/影片</h2>
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
          </div>
        </div>

        {/* 價格設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">價格設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* 鞋子專屬資訊 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">鞋子專屬資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 鞋型 */}
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

            {/* 性別（多選） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                適用性別
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'MEN', label: '男款' },
                  { value: 'WOMEN', label: '女款' },
                  { value: 'UNISEX', label: '中性' },
                  { value: 'KIDS', label: '童款' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleGender(option.value)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.genders.includes(option.value)
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">可選擇多個適用性別（如母子鱷魚同時有男童和女童款）</p>
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

        {/* 展示設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">展示設定</h2>
          <p className="text-sm text-gray-600 mb-4">
            新增的產品會自動上架為「在售」狀態，並公開顯示在前台。
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

        {/* 尺碼與顏色管理提示 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">尺碼與顏色管理</h3>
              <p className="text-sm text-green-700 mt-1">
                產品創建完成後，您可以在編輯頁面設定：
              </p>
              <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
                <li><strong>尺碼管理</strong> - 點選設定可用尺寸（無限庫存模式，無需管理庫存）</li>
                <li><strong>顏色管理</strong> - 添加多種顏色選項，設定專屬色碼和價格調整</li>
              </ul>
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
