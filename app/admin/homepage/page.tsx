'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import toast from 'react-hot-toast'
import {
  Save, Plus, Trash2, Edit, Clock, Image as ImageIcon,
  Tag, ShoppingBag, Star, Gift, Megaphone, Package
} from 'lucide-react'
import SingleImageUpload from '@/components/admin/SingleImageUpload'

// GraphQL 查詢和變更
const GET_HOMEPAGE_DATA = gql`
  query GetHomepageData {
    heroSlides {
      id
      title
      subtitle
      description
      image
      link
      cta
      bgColor
      isActive
      sortOrder
    }
    activeSaleCountdown {
      id
      title
      description
      highlightText
      endTime
      bgColor
      textColor
      link
      isActive
    }
    allFlashSales {
      id
      name
      startTime
      endTime
      bgColor
      products
      maxProducts
      isActive
      showOnHomepage
      sortOrder
    }
    todaysDeal {
      id
      date
      title
      subtitle
      products
      bgColor
      isActive
    }
    products {
      id
      name
      slug
      price
      originalPrice
      images
    }
  }
`

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      slug
      price
      originalPrice
      images
      stock
      category {
        name
      }
    }
  }
`

const GET_BUNDLES = gql`
  query GetBundles {
    productBundles {
      id
      name
      slug
      originalPrice
      bundlePrice
      discount
      discountPercent
      isActive
      isFeatured
      showOnHomepage
      sortOrder
      startDate
      endDate
      items {
        id
        productId
        quantity
        product {
          name
          price
        }
      }
    }
  }
`

const CREATE_BUNDLE = gql`
  mutation CreateProductBundle($input: CreateProductBundleInput!) {
    createProductBundle(input: $input) {
      id
    }
  }
`

const UPDATE_BUNDLE = gql`
  mutation UpdateProductBundle($id: ID!, $input: UpdateProductBundleInput!) {
    updateProductBundle(id: $id, input: $input) {
      id
    }
  }
`

const DELETE_BUNDLE = gql`
  mutation DeleteProductBundle($id: ID!) {
    deleteProductBundle(id: $id)
  }
`

const ADD_BUNDLE_ITEM = gql`
  mutation AddBundleItem($input: AddBundleItemInput!) {
    addBundleItem(input: $input) {
      id
    }
  }
`

const REMOVE_BUNDLE_ITEM = gql`
  mutation RemoveBundleItem($id: ID!) {
    removeBundleItem(id: $id)
  }
`

const CREATE_HERO_SLIDE = gql`
  mutation CreateHeroSlide($input: CreateHeroSlideInput!) {
    createHeroSlide(input: $input) {
      id
    }
  }
`

const UPDATE_HERO_SLIDE = gql`
  mutation UpdateHeroSlide($id: ID!, $input: UpdateHeroSlideInput!) {
    updateHeroSlide(id: $id, input: $input) {
      id
    }
  }
`

const DELETE_HERO_SLIDE = gql`
  mutation DeleteHeroSlide($id: ID!) {
    deleteHeroSlide(id: $id)
  }
`

const UPSERT_SALE_COUNTDOWN = gql`
  mutation UpsertSaleCountdown($input: SaleCountdownInput!) {
    upsertSaleCountdown(input: $input) {
      id
    }
  }
`

const UPSERT_FLASH_SALE = gql`
  mutation UpsertFlashSale($input: FlashSaleConfigInput!) {
    upsertFlashSale(input: $input) {
      id
    }
  }
`

const CREATE_FLASH_SALE = gql`
  mutation CreateFlashSale($input: FlashSaleConfigInput!) {
    createFlashSale(input: $input) {
      id
      name
    }
  }
`

const UPDATE_FLASH_SALE = gql`
  mutation UpdateFlashSale($id: ID!, $input: UpdateFlashSaleInput!) {
    updateFlashSale(id: $id, input: $input) {
      id
      name
    }
  }
`

const DELETE_FLASH_SALE = gql`
  mutation DeleteFlashSale($id: ID!) {
    deleteFlashSale(id: $id)
  }
`

const UPSERT_POPULAR_PRODUCTS = gql`
  mutation UpsertPopularProductsConfig($input: PopularProductsConfigInput!) {
    upsertPopularProductsConfig(input: $input) {
      id
    }
  }
`

const UPSERT_DAILY_DEAL = gql`
  mutation UpsertDailyDeal($date: DateTime!, $input: DailyDealConfigInput!) {
    upsertDailyDeal(date: $date, input: $input) {
      id
    }
  }
`

export default function HomepageManagement() {
  const [activeTab, setActiveTab] = useState('hero')

  // 查詢數據
  const { data, loading, refetch } = useQuery(GET_HOMEPAGE_DATA)
  const { data: productsData } = useQuery(GET_PRODUCTS)
  const { data: bundlesData, refetch: refetchBundles } = useQuery(GET_BUNDLES)

  // Mutations
  const [createHeroSlide] = useMutation(CREATE_HERO_SLIDE)
  const [updateHeroSlide] = useMutation(UPDATE_HERO_SLIDE)
  const [deleteHeroSlide] = useMutation(DELETE_HERO_SLIDE)
  const [upsertSaleCountdown] = useMutation(UPSERT_SALE_COUNTDOWN)
  const [upsertFlashSale] = useMutation(UPSERT_FLASH_SALE)
  const [createFlashSaleMutation] = useMutation(CREATE_FLASH_SALE)
  const [updateFlashSaleMutation] = useMutation(UPDATE_FLASH_SALE)
  const [deleteFlashSaleMutation] = useMutation(DELETE_FLASH_SALE)
  const [upsertPopularProducts] = useMutation(UPSERT_POPULAR_PRODUCTS)
  const [upsertDailyDeal] = useMutation(UPSERT_DAILY_DEAL)
  const [createBundle] = useMutation(CREATE_BUNDLE)
  const [updateBundle] = useMutation(UPDATE_BUNDLE)
  const [deleteBundle] = useMutation(DELETE_BUNDLE)
  const [addBundleItem] = useMutation(ADD_BUNDLE_ITEM)
  const [removeBundleItem] = useMutation(REMOVE_BUNDLE_ITEM)

  // 輪播圖管理
  const [editingSlide, setEditingSlide] = useState(null)
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '/flash-sale',
    cta: '立即搶購',
    bgColor: 'from-red-500 to-orange-500',
    isActive: true
  })

  // 促銷倒計時
  const [countdownForm, setCountdownForm] = useState({
    title: '限時特賣',
    description: '全場5折起！買越多省越多！',
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    highlightText: '限時特賣 • SALE'
  })

  // 限時搶購
  const [editingFlashSale, setEditingFlashSale] = useState<string | null>(null)
  const [flashSaleForm, setFlashSaleForm] = useState({
    title: '限時搶購',
    description: '每2小時更新一次商品',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    discountPercentage: 50,
    maxProducts: 6,
    selectedProducts: [] as string[],
    isActive: true,
    showOnHomepage: false,
    sortOrder: 0
  })

  // 熱門產品
  const [popularForm, setPopularForm] = useState({
    title: '人氣精選',
    subtitle: '大家都在買',
    algorithm: 'SALES_VOLUME',
    maxProducts: 8,
    selectedProducts: []
  })

  // 今日特價
  const [dailyDealForm, setDailyDealForm] = useState({
    title: '今日特價',
    subtitle: '每日10點更新',
    selectedProducts: [], // 多個產品
    maxProducts: 4 // 顯示數量
  })

  // 組合套裝管理
  const [editingBundle, setEditingBundle] = useState(null)
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    bundlePrice: 0,
    isActive: true,
    isFeatured: false,
    showOnHomepage: true,
    selectedProducts: [] // { productId, quantity }
  })

  // 處理輪播圖保存
  const handleSaveSlide = async () => {
    try {
      if (editingSlide) {
        await updateHeroSlide({
          variables: {
            id: editingSlide,
            input: slideForm
          }
        })
        toast.success('輪播圖已更新')
      } else {
        await createHeroSlide({
          variables: {
            input: {
              ...slideForm,
              isActive: true,
              sortOrder: (data?.heroSlides?.length || 0) + 1
            }
          }
        })
        toast.success('輪播圖已新增')
      }
      setEditingSlide(null)
      setSlideForm({
        title: '',
        subtitle: '',
        description: '',
        image: '',
        link: '/flash-sale',
        cta: '立即搶購',
        bgColor: 'from-red-500 to-orange-500',
        isActive: true
      })
      refetch()
    } catch (error) {
      toast.error('保存失敗')
    }
  }

  // 處理刪除輪播圖
  const handleDeleteSlide = async (id) => {
    if (!confirm('確定要刪除這個輪播圖嗎？')) return

    try {
      await deleteHeroSlide({ variables: { id } })
      toast.success('輪播圖已刪除')
      refetch()
    } catch (error) {
      toast.error('刪除失敗')
    }
  }

  // 處理促銷倒計時保存
  const handleSaveCountdown = async () => {
    try {
      await upsertSaleCountdown({
        variables: {
          input: {
            ...countdownForm,
            isActive: true
          }
        }
      })
      toast.success('促銷倒計時已更新')
      refetch()
    } catch (error) {
      toast.error('保存失敗')
    }
  }

  // 處理限時搶購保存（創建或更新）
  const handleSaveFlashSale = async () => {
    try {
      // 轉換 datetime-local 格式為 ISO-8601
      const startTime = flashSaleForm.startTime.length === 16
        ? new Date(flashSaleForm.startTime + ':00').toISOString()
        : new Date(flashSaleForm.startTime).toISOString()

      const endTime = flashSaleForm.endTime.length === 16
        ? new Date(flashSaleForm.endTime + ':00').toISOString()
        : new Date(flashSaleForm.endTime).toISOString()

      // 構建 products JSON 格式：產品 ID 列表與折扣設定
      const products = {
        productIds: flashSaleForm.selectedProducts,
        discountPercentage: flashSaleForm.discountPercentage,
        description: flashSaleForm.description
      }

      if (editingFlashSale) {
        // 更新現有活動
        await updateFlashSaleMutation({
          variables: {
            id: editingFlashSale,
            input: {
              name: flashSaleForm.title,
              startTime,
              endTime,
              bgColor: '#FF6B6B',
              products,
              maxProducts: flashSaleForm.maxProducts,
              isActive: flashSaleForm.isActive,
              showOnHomepage: flashSaleForm.showOnHomepage,
              sortOrder: flashSaleForm.sortOrder
            }
          }
        })
        toast.success('限時搶購已更新')
      } else {
        // 創建新活動
        await createFlashSaleMutation({
          variables: {
            input: {
              name: flashSaleForm.title,
              startTime,
              endTime,
              bgColor: '#FF6B6B',
              products,
              maxProducts: flashSaleForm.maxProducts,
              isActive: flashSaleForm.isActive,
              showOnHomepage: flashSaleForm.showOnHomepage,
              sortOrder: flashSaleForm.sortOrder
            }
          }
        })
        toast.success('限時搶購活動已創建')
      }

      // 重置表單
      resetFlashSaleForm()
      refetch()
    } catch (error) {
      console.error('限時搶購保存錯誤:', error)
      toast.error(`保存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  // 重置限時搶購表單
  const resetFlashSaleForm = () => {
    setEditingFlashSale(null)
    setFlashSaleForm({
      title: '限時搶購',
      description: '每2小時更新一次商品',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      discountPercentage: 50,
      maxProducts: 6,
      selectedProducts: [],
      isActive: true,
      showOnHomepage: false,
      sortOrder: 0
    })
  }

  // 編輯限時搶購
  const handleEditFlashSale = (flashSale: any) => {
    let productsData: any = {}
    try {
      productsData = typeof flashSale.products === 'string'
        ? JSON.parse(flashSale.products)
        : (flashSale.products || {})
    } catch (e) {
      console.error('解析 products JSON 失敗:', e)
    }

    setEditingFlashSale(flashSale.id)
    setFlashSaleForm({
      title: flashSale.name,
      description: productsData.description || '每2小時更新一次商品',
      startTime: new Date(flashSale.startTime).toISOString().slice(0, 16),
      endTime: new Date(flashSale.endTime).toISOString().slice(0, 16),
      discountPercentage: productsData.discountPercentage || 50,
      maxProducts: flashSale.maxProducts,
      selectedProducts: productsData.productIds || [],
      isActive: flashSale.isActive,
      showOnHomepage: flashSale.showOnHomepage,
      sortOrder: flashSale.sortOrder
    })
  }

  // 刪除限時搶購
  const handleDeleteFlashSale = async (id: string) => {
    if (!confirm('確定要刪除這個限時搶購活動嗎？')) return

    try {
      await deleteFlashSaleMutation({ variables: { id } })
      toast.success('限時搶購活動已刪除')
      refetch()
    } catch (error) {
      console.error('刪除限時搶購錯誤:', error)
      toast.error(`刪除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  // 快速切換首頁顯示
  const handleToggleHomepageDisplay = async (id: string, currentValue: boolean) => {
    try {
      await updateFlashSaleMutation({
        variables: {
          id,
          input: { showOnHomepage: !currentValue }
        }
      })
      toast.success(!currentValue ? '已設為首頁顯示' : '已取消首頁顯示')
      refetch()
    } catch (error) {
      toast.error('更新失敗')
    }
  }

  // 處理熱門產品保存
  const handleSavePopular = async () => {
    try {
      await upsertPopularProducts({
        variables: {
          input: {
            ...popularForm,
            isActive: true
          }
        }
      })
      toast.success('熱門產品設定已更新')
      refetch()
    } catch (error) {
      toast.error('保存失敗')
    }
  }

  // 處理今日特價保存
  const handleSaveDailyDeal = async () => {
    try {
      // 使用今天的日期（00:00:00）
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 構建 products JSON 格式：多個產品 ID
      const products = {
        productIds: dailyDealForm.selectedProducts,
        maxProducts: dailyDealForm.maxProducts
      }

      await upsertDailyDeal({
        variables: {
          date: today.toISOString(),
          input: {
            title: dailyDealForm.title,
            subtitle: dailyDealForm.subtitle,
            products,
            bgColor: '#FFF7ED',
            isActive: true
          }
        }
      })
      toast.success('今日特價設定已更新')
      refetch()
    } catch (error) {
      console.error('今日特價保存錯誤:', error)
      toast.error(`保存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  // 處理組合套裝保存
  const handleSaveBundle = async () => {
    try {
      // 計算原價總和
      const originalPrice = bundleForm.selectedProducts.reduce((sum, item) => {
        const product = productsData?.products?.find(p => p.id === item.productId)
        return sum + (product ? parseFloat(product.price) * item.quantity : 0)
      }, 0)

      // 確保 bundlePrice 是有效數字
      const bundlePrice = parseFloat(bundleForm.bundlePrice) || 0

      // 驗證數據
      if (originalPrice <= 0) {
        toast.error('請選擇至少一個產品')
        return
      }

      if (bundlePrice <= 0) {
        toast.error('套裝價格必須大於 0')
        return
      }

      if (bundlePrice > originalPrice) {
        toast.error('套裝價格不能高於原價')
        return
      }

      const input = {
        name: bundleForm.name,
        description: bundleForm.description,
        originalPrice: String(originalPrice.toFixed(2)),  // 轉換為字符串，保留2位小數
        bundlePrice: String(bundlePrice.toFixed(2)),      // 轉換為字符串，保留2位小數
        isActive: bundleForm.isActive,
        isFeatured: bundleForm.isFeatured,
        showOnHomepage: bundleForm.showOnHomepage
      }

      console.log('準備創建組合套裝，input:', input)

      let bundleId

      if (editingBundle) {
        await updateBundle({
          variables: {
            id: editingBundle,
            input
          }
        })
        bundleId = editingBundle
        toast.success('組合套裝已更新')
      } else {
        const result = await createBundle({
          variables: { input }
        })
        bundleId = result.data.createProductBundle.id
        toast.success('組合套裝已創建')
      }

      // 添加產品到組合
      for (const item of bundleForm.selectedProducts) {
        await addBundleItem({
          variables: {
            input: {
              bundleId,
              productId: item.productId,
              quantity: item.quantity,
              allowVariantSelection: true
            }
          }
        })
      }

      setEditingBundle(null)
      setBundleForm({
        name: '',
        description: '',
        bundlePrice: 0,
        isActive: true,
        isFeatured: false,
        showOnHomepage: true,
        selectedProducts: []
      })
      refetchBundles()
    } catch (error) {
      console.error('組合套裝保存錯誤:', error)
      toast.error(`保存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  // 處理刪除組合套裝
  const handleDeleteBundle = async (id) => {
    if (!confirm('確定要刪除這個組合套裝嗎？')) return

    try {
      await deleteBundle({ variables: { id } })
      toast.success('組合套裝已刪除')
      refetchBundles()
    } catch (error) {
      toast.error('刪除失敗')
    }
  }

  // 切換產品選擇（用於組合套裝）
  const toggleBundleProduct = (productId) => {
    const existing = bundleForm.selectedProducts.find(p => p.productId === productId)
    if (existing) {
      setBundleForm({
        ...bundleForm,
        selectedProducts: bundleForm.selectedProducts.filter(p => p.productId !== productId)
      })
    } else {
      setBundleForm({
        ...bundleForm,
        selectedProducts: [...bundleForm.selectedProducts, { productId, quantity: 1 }]
      })
    }
  }

  // 更新產品數量
  const updateBundleProductQuantity = (productId, quantity) => {
    setBundleForm({
      ...bundleForm,
      selectedProducts: bundleForm.selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity: parseInt(quantity) || 1 } : p
      )
    })
  }

  // 載入現有數據
  React.useEffect(() => {
    if (data) {
      if (data.activeSaleCountdown) {
        setCountdownForm({
          title: data.activeSaleCountdown.title,
          description: data.activeSaleCountdown.description,
          endTime: new Date(data.activeSaleCountdown.endTime).toISOString().slice(0, 16),
          highlightText: data.activeSaleCountdown.highlightText
        })
      }

      // 限時搶購現在使用列表管理，不需要在此初始化單個活動

      if (data.popularProductsConfig) {
        setPopularForm({
          title: data.popularProductsConfig.title,
          subtitle: data.popularProductsConfig.subtitle,
          algorithm: data.popularProductsConfig.algorithm,
          maxProducts: data.popularProductsConfig.maxProducts
        })
      }

      if (data.todaysDeal) {
        // 解析 products JSON
        let productsData = {}
        try {
          productsData = typeof data.todaysDeal.products === 'string'
            ? JSON.parse(data.todaysDeal.products)
            : (data.todaysDeal.products || {})
        } catch (e) {
          console.error('解析 todaysDeal products JSON 失敗:', e)
          productsData = {}
        }

        setDailyDealForm({
          title: data.todaysDeal.title || '今日特價',
          subtitle: data.todaysDeal.subtitle || '每日10點更新',
          selectedProducts: productsData.productIds || [],
          maxProducts: productsData.maxProducts || 4
        })
      }
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">首頁內容管理</h1>
        <p className="text-gray-600 mt-1 text-sm lg:text-base">管理首頁的促銷活動內容和產品推薦</p>
      </div>

      {/* Tab 切換 - 響應式設計 */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-1 lg:space-x-4 min-w-max">
          {[
            { id: 'hero', label: '輪播圖', icon: ImageIcon },
            { id: 'countdown', label: '倒計時', icon: Clock },
            { id: 'flash', label: '限時搶購', icon: Tag },
            { id: 'daily', label: '今日特價', icon: Package },
            { id: 'popular', label: '熱門產品', icon: Star },
            { id: 'bundles', label: '組合套裝', icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-3 px-2 lg:px-3 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} className="mr-1 lg:mr-2 flex-shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 輪播圖管理 */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="text-indigo-600" />
              輪播圖管理
            </h2>

            {/* 現有輪播圖列表 */}
            <div className="space-y-3 mb-6">
              {data?.heroSlides?.map((slide) => (
                <div key={slide.id} className="border rounded-lg p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* 縮圖預覽 */}
                    <div className="w-full sm:w-24 h-24 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-r ${slide.bgColor || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                          <ImageIcon size={20} className="text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm lg:text-base truncate">{slide.title}</h3>
                      <p className="text-xs lg:text-sm text-gray-600 truncate">{slide.subtitle}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{slide.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingSlide(slide.id)
                        setSlideForm({
                          title: slide.title,
                          subtitle: slide.subtitle,
                          description: slide.description,
                          image: slide.image,
                          link: slide.link,
                          cta: slide.cta,
                          bgColor: slide.bgColor,
                          isActive: slide.isActive
                        })
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 新增/編輯表單 */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">
                {editingSlide ? '編輯輪播圖' : '新增輪播圖'}
              </h3>

              {/* 背景圖片上傳 */}
              <div className="mb-6">
                <SingleImageUpload
                  value={slideForm.image}
                  onChange={(url) => setSlideForm({ ...slideForm, image: url })}
                  label="背景圖片（建議尺寸：1920x600 像素）"
                  folder="banners"
                />
                <p className="text-xs text-gray-500 mt-2">
                  如果沒有上傳背景圖片，將使用下方選擇的背景顏色
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    標題
                  </label>
                  <input
                    type="text"
                    value={slideForm.title}
                    onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：雙11限時特賣"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    副標題
                  </label>
                  <input
                    type="text"
                    value={slideForm.subtitle}
                    onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：全場5折起"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    value={slideForm.description}
                    onChange={(e) => setSlideForm({ ...slideForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：買2送1，滿999免運"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    連結網址
                  </label>
                  <input
                    type="text"
                    value={slideForm.link}
                    onChange={(e) => setSlideForm({ ...slideForm, link: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：/flash-sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    按鈕文字
                  </label>
                  <input
                    type="text"
                    value={slideForm.cta}
                    onChange={(e) => setSlideForm({ ...slideForm, cta: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：立即搶購"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    背景顏色（無圖片時使用）
                  </label>
                  <select
                    value={slideForm.bgColor}
                    onChange={(e) => setSlideForm({ ...slideForm, bgColor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="from-red-500 to-orange-500">紅橙漸層</option>
                    <option value="from-purple-500 to-pink-500">紫粉漸層</option>
                    <option value="from-blue-500 to-cyan-500">藍青漸層</option>
                    <option value="from-green-500 to-teal-500">綠藍漸層</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSaveSlide}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  保存
                </button>
                {editingSlide && (
                  <button
                    onClick={() => {
                      setEditingSlide(null)
                      setSlideForm({
                        title: '',
                        subtitle: '',
                        description: '',
                        image: '',
                        link: '/flash-sale',
                        cta: '立即搶購',
                        bgColor: 'from-red-500 to-orange-500',
                        isActive: true
                      })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 促銷倒計時 */}
      {activeTab === 'countdown' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-indigo-600" size={20} />
            促銷倒計時設定
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活動標題
              </label>
              <input
                type="text"
                value={countdownForm.title}
                onChange={(e) => setCountdownForm({ ...countdownForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="例：限時特賣"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活動描述
              </label>
              <input
                type="text"
                value={countdownForm.description}
                onChange={(e) => setCountdownForm({ ...countdownForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="例：全場5折起！買越多省越多！"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束時間
              </label>
              <input
                type="datetime-local"
                value={countdownForm.endTime}
                onChange={(e) => setCountdownForm({ ...countdownForm, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                滾動文字
              </label>
              <input
                type="text"
                value={countdownForm.highlightText}
                onChange={(e) => setCountdownForm({ ...countdownForm, highlightText: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="例：限時特賣 • SALE"
              />
            </div>
            <button
              onClick={handleSaveCountdown}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save size={18} />
              保存設定
            </button>
          </div>
        </div>
      )}

      {/* 限時搶購 */}
      {activeTab === 'flash' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2">
              <Tag className="text-indigo-600" size={20} />
              限時搶購活動管理
            </h2>
            <div className="text-xs lg:text-sm text-gray-500">
              首頁顯示的活動將按照排序順序展示
            </div>
          </div>

          {/* 現有活動列表 */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">所有限時搶購活動</h3>
            {data?.allFlashSales?.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">尚未創建任何限時搶購活動</p>
            ) : (
              <div className="space-y-3">
                {data?.allFlashSales?.map((flashSale: any) => {
                  const now = new Date()
                  const startTime = new Date(flashSale.startTime)
                  const endTime = new Date(flashSale.endTime)
                  const isOngoing = startTime <= now && endTime > now
                  const isExpired = endTime <= now
                  const isUpcoming = startTime > now

                  return (
                    <div
                      key={flashSale.id}
                      className={`border rounded-lg p-3 lg:p-4 ${
                        flashSale.showOnHomepage ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm lg:text-base">{flashSale.name}</h4>
                            {flashSale.showOnHomepage && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                首頁顯示
                              </span>
                            )}
                            {!flashSale.isActive && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                已停用
                              </span>
                            )}
                            {isOngoing && flashSale.isActive && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
                                進行中
                              </span>
                            )}
                            {isExpired && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                已結束
                              </span>
                            )}
                            {isUpcoming && flashSale.isActive && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                即將開始
                              </span>
                            )}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-600 space-y-1">
                            <p className="break-all">
                              時間：{new Date(flashSale.startTime).toLocaleString('zh-TW')} ~{' '}
                              {new Date(flashSale.endTime).toLocaleString('zh-TW')}
                            </p>
                            <p>排序：{flashSale.sortOrder} | 最多顯示 {flashSale.maxProducts} 個商品</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* 首頁顯示開關 */}
                          <button
                            onClick={() => handleToggleHomepageDisplay(flashSale.id, flashSale.showOnHomepage)}
                            className={`px-2 lg:px-3 py-1.5 text-xs lg:text-sm rounded-lg transition-colors whitespace-nowrap ${
                              flashSale.showOnHomepage
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {flashSale.showOnHomepage ? '首頁中' : '設首頁'}
                          </button>
                          <button
                            onClick={() => handleEditFlashSale(flashSale)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFlashSale(flashSale.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 新增/編輯表單 */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-700 mb-4">
              {editingFlashSale ? '編輯限時搶購活動' : '新增限時搶購活動'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活動標題 *
                  </label>
                  <input
                    type="text"
                    value={flashSaleForm.title}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：限時搶購"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活動描述
                  </label>
                  <input
                    type="text"
                    value={flashSaleForm.description}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例：每2小時更新一次商品"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時間 *
                  </label>
                  <input
                    type="datetime-local"
                    value={flashSaleForm.startTime}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結束時間 *
                  </label>
                  <input
                    type="datetime-local"
                    value={flashSaleForm.endTime}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣百分比
                  </label>
                  <input
                    type="number"
                    value={flashSaleForm.discountPercentage}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, discountPercentage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顯示產品數量
                  </label>
                  <input
                    type="number"
                    value={flashSaleForm.maxProducts}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, maxProducts: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    首頁排序（數字越小越前面）
                  </label>
                  <input
                    type="number"
                    value={flashSaleForm.sortOrder}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, sortOrder: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
              </div>

              {/* 狀態選項 */}
              <div className="flex flex-wrap gap-4 lg:gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flashSaleForm.isActive}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">啟用活動</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flashSaleForm.showOnHomepage}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, showOnHomepage: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">顯示在首頁</span>
                </label>
              </div>

              {/* 商品選擇器 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇商品
                </label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {productsData?.products?.map((product: any) => (
                    <label key={product.id} className="flex items-center space-x-3 py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={flashSaleForm.selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFlashSaleForm({
                              ...flashSaleForm,
                              selectedProducts: [...flashSaleForm.selectedProducts, product.id]
                            })
                          } else {
                            setFlashSaleForm({
                              ...flashSaleForm,
                              selectedProducts: flashSaleForm.selectedProducts.filter((id: string) => id !== product.id)
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          ${product.price} {product.originalPrice && <span className="line-through">${product.originalPrice}</span>}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">已選擇 {flashSaleForm.selectedProducts.length} 個商品</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveFlashSale}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  {editingFlashSale ? '更新活動' : '創建活動'}
                </button>
                {editingFlashSale && (
                  <button
                    onClick={resetFlashSaleForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消編輯
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 今日特價 */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" size={20} />
            今日特價設定
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  區塊標題
                </label>
                <input
                  type="text"
                  value={dailyDealForm.title}
                  onChange={(e) => setDailyDealForm({ ...dailyDealForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例：今日特價"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  副標題
                </label>
                <input
                  type="text"
                  value={dailyDealForm.subtitle}
                  onChange={(e) => setDailyDealForm({ ...dailyDealForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例：每日10點更新"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  顯示數量
                </label>
                <input
                  type="number"
                  value={dailyDealForm.maxProducts}
                  onChange={(e) => setDailyDealForm({ ...dailyDealForm, maxProducts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            {/* 商品選擇器 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇商品（如果不選擇，將自動顯示有折扣的產品）
              </label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {productsData?.products?.map((product) => (
                  <label key={product.id} className="flex items-center space-x-3 py-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={dailyDealForm.selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDailyDealForm({
                            ...dailyDealForm,
                            selectedProducts: [...dailyDealForm.selectedProducts, product.id]
                          })
                        } else {
                          setDailyDealForm({
                            ...dailyDealForm,
                            selectedProducts: dailyDealForm.selectedProducts.filter(id => id !== product.id)
                          })
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        ${product.price} {product.originalPrice && <span className="line-through">${product.originalPrice}</span>}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">已選擇 {dailyDealForm.selectedProducts.length} 個商品</p>
            </div>

            <button
              onClick={handleSaveDailyDeal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save size={18} />
              保存設定
            </button>
          </div>
        </div>
      )}

      {/* 熱門產品 */}
      {activeTab === 'popular' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="text-indigo-600" size={20} />
            熱門產品設定
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  區塊標題
                </label>
                <input
                  type="text"
                  value={popularForm.title}
                  onChange={(e) => setPopularForm({ ...popularForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例：人氣精選"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  副標題
                </label>
                <input
                  type="text"
                  value={popularForm.subtitle}
                  onChange={(e) => setPopularForm({ ...popularForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例：大家都在買"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序算法
                </label>
                <select
                  value={popularForm.algorithm}
                  onChange={(e) => setPopularForm({ ...popularForm, algorithm: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SALES_VOLUME">按銷量排序</option>
                  <option value="RATING">按評分排序</option>
                  <option value="VIEW_COUNT">按瀏覽量排序</option>
                  <option value="TRENDING">綜合推薦</option>
                  <option value="MANUAL">手動選擇</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  顯示數量
                </label>
                <input
                  type="number"
                  value={popularForm.maxProducts}
                  onChange={(e) => setPopularForm({ ...popularForm, maxProducts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="4"
                  max="16"
                />
              </div>
            </div>

            {/* 手動選擇商品（只在 MANUAL 模式下顯示） */}
            {popularForm.algorithm === 'MANUAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇商品
                </label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {productsData?.products?.map((product) => (
                    <label key={product.id} className="flex items-center space-x-3 py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={popularForm.selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPopularForm({
                              ...popularForm,
                              selectedProducts: [...popularForm.selectedProducts, product.id]
                            })
                          } else {
                            setPopularForm({
                              ...popularForm,
                              selectedProducts: popularForm.selectedProducts.filter(id => id !== product.id)
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          ${product.price} {product.originalPrice && <span className="line-through">${product.originalPrice}</span>}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">已選擇 {popularForm.selectedProducts.length} 個商品</p>
              </div>
            )}

            <button
              onClick={handleSavePopular}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save size={18} />
              保存設定
            </button>
          </div>
        </div>
      )}

      {/* 組合套裝 */}
      {activeTab === 'bundles' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="text-indigo-600" size={20} />
            組合套裝管理
          </h2>

          {/* 現有組合列表 */}
          <div className="space-y-3 mb-6">
            {bundlesData?.productBundles?.map((bundle) => (
              <div key={bundle.id} className="border rounded-lg p-3 lg:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base lg:text-lg">{bundle.name}</h3>
                      {bundle.isFeatured && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                          精選
                        </span>
                      )}
                      {!bundle.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                          已停用
                        </span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 mb-2 line-clamp-2">{bundle.description}</p>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                      <div>
                        <span className="text-gray-500">原價：</span>
                        <span className="line-through">${bundle.originalPrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">優惠價：</span>
                        <span className="text-red-600 font-semibold">${bundle.bundlePrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">折扣：</span>
                        <span className="text-green-600">{bundle.discountPercent}%</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs lg:text-sm text-gray-500">
                      包含 {bundle.items?.length || 0} 個產品
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingBundle(bundle.id)
                        setBundleForm({
                          name: bundle.name,
                          description: bundle.description,
                          bundlePrice: bundle.bundlePrice,
                          isActive: bundle.isActive,
                          isFeatured: bundle.isFeatured,
                          showOnHomepage: bundle.showOnHomepage,
                          selectedProducts: bundle.items?.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity
                          })) || []
                        })
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBundle(bundle.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 新增/編輯表單 */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">
              {editingBundle ? '編輯組合套裝' : '新增組合套裝'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  組合名稱 *
                </label>
                <input
                  type="text"
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例：春季運動套組"
                />
                <p className="text-xs text-gray-500 mt-1">
                  系統會自動生成 URL，無需手動輸入
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="組合套裝的詳細描述..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優惠套裝價 *
                </label>
                <input
                  type="number"
                  value={bundleForm.bundlePrice}
                  onChange={(e) => setBundleForm({ ...bundleForm, bundlePrice: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {bundleForm.selectedProducts.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    原價總和：${bundleForm.selectedProducts.reduce((sum, item) => {
                      const product = productsData?.products?.find(p => p.id === item.productId)
                      return sum + (product ? parseFloat(product.price) * item.quantity : 0)
                    }, 0).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bundleForm.isActive}
                    onChange={(e) => setBundleForm({ ...bundleForm, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">啟用</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bundleForm.isFeatured}
                    onChange={(e) => setBundleForm({ ...bundleForm, isFeatured: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">精選推薦</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bundleForm.showOnHomepage}
                    onChange={(e) => setBundleForm({ ...bundleForm, showOnHomepage: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">首頁展示</span>
                </label>
              </div>

              {/* 產品選擇器 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇組合產品 *
                </label>
                <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                  {productsData?.products?.map((product) => {
                    const isSelected = bundleForm.selectedProducts.find(p => p.productId === product.id)
                    return (
                      <div key={product.id} className="flex items-center gap-3 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleBundleProduct(product.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            ${product.price} {product.category?.name && `· ${product.category.name}`}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">數量：</label>
                            <input
                              type="number"
                              value={isSelected.quantity}
                              onChange={(e) => updateBundleProductQuantity(product.id, e.target.value)}
                              className="w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                              min="1"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  已選擇 {bundleForm.selectedProducts.length} 個產品
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveBundle}
                  disabled={!bundleForm.name || bundleForm.selectedProducts.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} />
                  保存組合套裝
                </button>
                {editingBundle && (
                  <button
                    onClick={() => {
                      setEditingBundle(null)
                      setBundleForm({
                        name: '',
                        description: '',
                        bundlePrice: 0,
                        isActive: true,
                        isFeatured: false,
                        showOnHomepage: true,
                        selectedProducts: []
                      })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}