'use client'

/**
 * 後台新增產品頁面
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_PRODUCT, CREATE_SIZE_CHART, GET_BRANDS, GET_CATEGORIES, GET_PRODUCTS } from '@/graphql/queries'
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

interface TempSizeChart {
  eu: string
  us: string
  uk: string
  cm: string
  footLength: number
  footWidth: string
  stock: number
  isActive: boolean
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
  isFeatured: false,
  isNewArrival: false,
  shoeType: '',
  gender: '',
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

// 預設尺碼對照表（男鞋）
const defaultMenSizes: Omit<TempSizeChart, 'isActive'>[] = [
  { eu: '39', us: '6.5', uk: '6', cm: '24.5', footLength: 24.5, footWidth: '標準', stock: 10 },
  { eu: '40', us: '7', uk: '6.5', cm: '25', footLength: 25.0, footWidth: '標準', stock: 10 },
  { eu: '41', us: '8', uk: '7', cm: '25.5', footLength: 25.5, footWidth: '標準', stock: 10 },
  { eu: '42', us: '8.5', uk: '7.5', cm: '26', footLength: 26.0, footWidth: '標準', stock: 10 },
  { eu: '43', us: '9.5', uk: '8.5', cm: '27', footLength: 27.0, footWidth: '標準', stock: 10 },
  { eu: '44', us: '10', uk: '9', cm: '27.5', footLength: 27.5, footWidth: '標準', stock: 10 },
  { eu: '45', us: '11', uk: '10', cm: '28.5', footLength: 28.5, footWidth: '標準', stock: 10 },
  { eu: '46', us: '12', uk: '11', cm: '29', footLength: 29.0, footWidth: '標準', stock: 10 },
]

// 預設尺碼對照表（女鞋）
const defaultWomenSizes: Omit<TempSizeChart, 'isActive'>[] = [
  { eu: '35', us: '5', uk: '2.5', cm: '22', footLength: 22.0, footWidth: '標準', stock: 10 },
  { eu: '36', us: '6', uk: '3.5', cm: '23', footLength: 23.0, footWidth: '標準', stock: 10 },
  { eu: '37', us: '6.5', uk: '4', cm: '23.5', footLength: 23.5, footWidth: '標準', stock: 10 },
  { eu: '38', us: '7', uk: '4.5', cm: '24', footLength: 24.0, footWidth: '標準', stock: 10 },
  { eu: '39', us: '8', uk: '5.5', cm: '24.5', footLength: 24.5, footWidth: '標準', stock: 10 },
  { eu: '40', us: '9', uk: '6.5', cm: '25.5', footLength: 25.5, footWidth: '標準', stock: 10 },
  { eu: '41', us: '10', uk: '7.5', cm: '26', footLength: 26.0, footWidth: '標準', stock: 10 },
]

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 尺碼管理狀態
  const [tempSizes, setTempSizes] = useState<TempSizeChart[]>([])
  const [editingSize, setEditingSize] = useState<TempSizeChart | null>(null)
  const [showBatchImport, setShowBatchImport] = useState(false)

  // 獲取品牌列表
  const { data: brandsData, loading: brandsLoading, error: brandsError } = useQuery(GET_BRANDS)
  // 獲取分類列表
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery(GET_CATEGORIES)

  // 創建尺碼表 mutation
  const [createSizeChart] = useMutation(CREATE_SIZE_CHART)

  const [createProduct] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [
      { query: GET_PRODUCTS },
      { query: GET_BRANDS },
      { query: GET_CATEGORIES },
    ],
    awaitRefetchQueries: true,
    onCompleted: async (data) => {
      const productId = data.createProduct.id

      // ✅ 如果有待添加的尺碼,批量創建
      if (tempSizes.length > 0) {
        try {
          toast.loading(`正在創建 ${tempSizes.length} 個尺碼...`, { id: 'create-sizes' })

          const promises = tempSizes.map((size) =>
            createSizeChart({
              variables: {
                input: {
                  productId,
                  variantId: null,
                  eu: size.eu,
                  us: size.us,
                  uk: size.uk,
                  cm: size.cm,
                  footLength: size.footLength,
                  footWidth: size.footWidth || null,
                  stock: size.stock,
                },
              },
            })
          )

          await Promise.all(promises)
          toast.success(
            `產品創建成功！已成功添加 ${tempSizes.length} 個尺碼，總庫存 ${tempSizes.reduce((sum, s) => sum + s.stock, 0)} 件`,
            { id: 'create-sizes' }
          )
        } catch (error: any) {
          console.error('批量創建尺碼失敗:', error)
          toast.error(`產品已創建,但尺碼添加失敗：${error.message}`, { id: 'create-sizes' })
        }
      } else {
        toast.success('產品創建成功！')
      }

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

  // ============================================
  // 尺碼管理功能
  // ============================================

  // 批量導入尺碼模板
  const handleBatchImport = (gender: 'men' | 'women') => {
    const template = gender === 'men' ? defaultMenSizes : defaultWomenSizes

    // 檢查已存在的尺碼（根據 EU 碼）
    const existingEuSizes = new Set(tempSizes.map((s) => s.eu))
    const newSizes = template.filter((size) => !existingEuSizes.has(size.eu))

    if (newSizes.length === 0) {
      toast.error(`${gender === 'men' ? '男款' : '女款'}尺碼模板中的所有尺碼都已存在，無需重複導入！`)
      setShowBatchImport(false)
      return
    }

    const skippedCount = template.length - newSizes.length
    if (skippedCount > 0) {
      toast.success(`跳過 ${skippedCount} 個已存在的尺碼，將導入 ${newSizes.length} 個新尺碼`)
    }

    const sizesToAdd = newSizes.map((size) => ({
      ...size,
      isActive: true,
    }))

    setTempSizes((prev) => [...prev, ...sizesToAdd])
    setShowBatchImport(false)
    toast.success(`已添加 ${newSizes.length} 個${gender === 'men' ? '男款' : '女款'}尺碼到列表中，每個尺碼庫存預設為 10 件！`)
  }

  // 新增/編輯尺碼
  const handleSaveSize = () => {
    if (!editingSize) return

    // 驗證必填欄位
    if (!editingSize.eu || !editingSize.us || !editingSize.uk || !editingSize.cm) {
      toast.error('請填寫所有必填欄位（EU、US、UK、CM）')
      return
    }

    if (!editingSize.footLength || editingSize.footLength <= 0) {
      toast.error('請輸入有效的腳長')
      return
    }

    if (editingSize.stock === undefined || editingSize.stock < 0) {
      toast.error('請輸入有效的庫存數量')
      return
    }

    // 檢查是否為新增或編輯（通過檢查是否有匹配的EU碼）
    const existingIndex = tempSizes.findIndex((s) => s.eu === editingSize.eu)

    if (existingIndex >= 0) {
      // 更新現有尺碼
      const updatedSizes = [...tempSizes]
      updatedSizes[existingIndex] = { ...editingSize }
      setTempSizes(updatedSizes)
      toast.success(`尺碼 EU ${editingSize.eu} 已更新`)
    } else {
      // 新增尺碼
      setTempSizes((prev) => [...prev, { ...editingSize }])
      toast.success(`尺碼 EU ${editingSize.eu} 已添加`)
    }

    setEditingSize(null)
  }

  // 刪除尺碼
  const handleDeleteSize = (eu: string) => {
    if (!confirm(`確定要刪除尺碼 EU ${eu} 嗎？`)) {
      return
    }

    setTempSizes((prev) => prev.filter((s) => s.eu !== eu))
    toast.success(`尺碼 EU ${eu} 已刪除`)
  }

  // 編輯尺碼
  const handleEditSize = (size: TempSizeChart) => {
    setEditingSize({ ...size })
    // 滾動到表單位置
    setTimeout(() => {
      document.getElementById('size-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // 新增尺碼
  const handleAddSize = () => {
    setEditingSize({
      eu: '',
      us: '',
      uk: '',
      cm: '',
      footLength: 0,
      footWidth: '標準',
      stock: 10,
      isActive: true,
    })
    // 滾動到表單位置
    setTimeout(() => {
      document.getElementById('size-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // 更新編輯中的尺碼欄位
  const updateEditingField = (field: keyof TempSizeChart, value: any) => {
    setEditingSize((prev) => (prev ? { ...prev, [field]: value } : null))
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

    if (!formData.brandId) {
      newErrors.brandId = '請選擇產品品牌'
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
          brandId: '品牌',
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
        brandId: formData.brandId || null,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: 0, // 庫存由尺碼管理，此處設為 0
        images: formData.images,
        isActive: true, // 新增產品自動設為在售狀態
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

        {/* 價格設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">價格設定</h2>
          <p className="text-sm text-gray-600 mb-4">
            庫存由各個尺碼獨立管理，創建產品後請前往「尺碼管理」設定各尺碼的庫存。
          </p>
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

        {/* 尺碼管理（預先設定） */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">尺碼與庫存設定</h2>
              <p className="text-sm text-gray-600 mt-1">
                預先設定產品的尺碼和庫存，產品創建後會自動添加這些尺碼
              </p>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={handleAddSize}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + 新增尺碼
            </button>
            <button
              type="button"
              onClick={() => setShowBatchImport(!showBatchImport)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showBatchImport ? '取消批量導入' : '批量導入'}
            </button>
          </div>

          {/* 批量導入選擇 */}
          {showBatchImport && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3">批量導入尺碼模板</h3>
              <p className="text-sm text-blue-800 mb-4">
                <strong>提示：</strong>系統會自動跳過已存在的尺碼，只導入新的尺碼。每個尺碼的庫存預設為 10 件。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleBatchImport('men')}
                  className="px-4 py-3 border-2 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  <div className="font-semibold text-blue-700">男款尺碼模板</div>
                  <div className="text-sm text-gray-600 mt-1">包含 EU 39-46 (US 6.5-12)，共 8 個尺碼</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchImport('women')}
                  className="px-4 py-3 border-2 border-pink-500 rounded-lg hover:bg-pink-100 transition-colors text-left"
                >
                  <div className="font-semibold text-pink-700">女款尺碼模板</div>
                  <div className="text-sm text-gray-600 mt-1">包含 EU 35-41 (US 5-10)，共 7 個尺碼</div>
                </button>
              </div>
            </div>
          )}

          {/* 尺碼列表 */}
          {tempSizes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">歐碼 (EU)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">美碼 (US)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">英碼 (UK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">厘米 (CM)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">腳長 (cm)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">腳寬</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">庫存</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tempSizes.map((size) => (
                      <tr key={size.eu} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{size.eu}</td>
                        <td className="px-4 py-3 text-gray-700">{size.us}</td>
                        <td className="px-4 py-3 text-gray-700">{size.uk}</td>
                        <td className="px-4 py-3 text-gray-700">{size.cm}</td>
                        <td className="px-4 py-3 text-gray-700">{size.footLength}</td>
                        <td className="px-4 py-3 text-gray-700">{size.footWidth || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${
                              size.stock === 0
                                ? 'text-red-600'
                                : size.stock <= 10
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {size.stock} 件
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditSize(size)}
                              className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              編輯
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSize(size.eu)}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 統計資訊 */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">總尺碼數：</span>
                    <span className="font-bold text-gray-900">{tempSizes.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">預計總庫存：</span>
                    <span className="font-bold text-green-600">
                      {tempSizes.reduce((sum, s) => sum + s.stock, 0)} 件
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 編輯/新增表單 */}
          {editingSize && (
            <div id="size-form" className="bg-blue-50 border-2 border-primary-500 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {tempSizes.find((s) => s.eu === editingSize.eu) ? `編輯尺碼 EU ${editingSize.eu}` : '新增尺碼'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingSize(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    歐碼 (EU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSize.eu}
                    onChange={(e) => updateEditingField('eu', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例如: 42"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    美碼 (US) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSize.us}
                    onChange={(e) => updateEditingField('us', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例如: 8.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    英碼 (UK) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSize.uk}
                    onChange={(e) => updateEditingField('uk', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例如: 7.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    厘米 (CM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSize.cm}
                    onChange={(e) => updateEditingField('cm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例如: 26"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    腳長 (cm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editingSize.footLength}
                    onChange={(e) => updateEditingField('footLength', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="26.0"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">腳寬</label>
                  <select
                    value={editingSize.footWidth || '標準'}
                    onChange={(e) => updateEditingField('footWidth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="窄版">窄版</option>
                    <option value="標準">標準</option>
                    <option value="寬版">寬版</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    庫存 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editingSize.stock}
                    onChange={(e) => updateEditingField('stock', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>

              {/* 儲存按鈕區域 */}
              <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingSize(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveSize}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  儲存
                </button>
              </div>
            </div>
          )}

          {/* 提示訊息 */}
          {tempSizes.length === 0 && !editingSize && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-2">尚未設定任何尺碼</p>
              <p className="text-sm text-gray-400">
                您可以點擊「新增尺碼」手動添加，或使用「批量導入」快速設定
              </p>
            </div>
          )}
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
