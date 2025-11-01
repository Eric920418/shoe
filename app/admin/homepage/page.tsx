'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// ==================== GraphQL Queries ====================

const GET_HOMEPAGE_CONFIGS = gql`
  query GetHomepageConfigs {
    homepageConfigs {
      id
      componentId
      componentType
      title
      subtitle
      isActive
      sortOrder
      settings
      mobileSettings
    }
  }
`

const UPDATE_HOMEPAGE_CONFIG = gql`
  mutation UpdateHomepageConfig($componentId: String!, $input: JSON!) {
    updateHomepageConfig(componentId: $componentId, input: $input) {
      id
      componentId
      isActive
      sortOrder
    }
  }
`

const UPDATE_HOMEPAGE_CONFIG_ORDER = gql`
  mutation UpdateHomepageConfigOrder($configs: [HomepageConfigOrder!]!) {
    updateHomepageConfigOrder(configs: $configs)
  }
`

const GET_HERO_SLIDES = gql`
  query GetHeroSlides {
    heroSlides {
      id
      title
      subtitle
      description
      image
      mobileImage
      cta
      ctaSecondary
      link
      linkSecondary
      textColor
      bgColor
      overlayOpacity
      textPosition
      sortOrder
      isActive
      startDate
      endDate
    }
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

const GET_SALE_COUNTDOWN = gql`
  query GetSaleCountdown {
    activeSaleCountdown {
      id
      title
      subtitle
      endTime
      bgColor
      textColor
      link
      isActive
    }
  }
`

const UPSERT_SALE_COUNTDOWN = gql`
  mutation UpsertSaleCountdown($input: SaleCountdownInput!) {
    upsertSaleCountdown(input: $input) {
      id
    }
  }
`

const GET_GUARANTEE_ITEMS = gql`
  query GetGuaranteeItems {
    guaranteeItems {
      id
      icon
      title
      description
      link
      sortOrder
      isActive
    }
  }
`

const UPSERT_GUARANTEE_ITEMS = gql`
  mutation UpsertGuaranteeItems($items: [GuaranteeItemInput!]!) {
    upsertGuaranteeItems(items: $items) {
      id
    }
  }
`

const GET_CATEGORY_DISPLAYS = gql`
  query GetCategoryDisplays {
    categoryDisplays {
      id
      categoryId
      displayName
      icon
      image
      bgColor
      textColor
      sortOrder
      isHighlighted
      showOnHomepage
      category {
        id
        name
        slug
      }
    }
  }
`

const UPDATE_CATEGORY_DISPLAY = gql`
  mutation UpdateCategoryDisplay($categoryId: String!, $input: CategoryDisplayInput!) {
    updateCategoryDisplay(categoryId: $categoryId, input: $input) {
      id
    }
  }
`

const GET_FLASH_SALE = gql`
  query GetFlashSale {
    activeFlashSale {
      id
      name
      startTime
      endTime
      bgImage
      bgColor
      products
      maxProducts
      isActive
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

const GET_FLOATING_PROMOS = gql`
  query GetFloatingPromos {
    activeFloatingPromos {
      id
      type
      icon
      text
      link
      bgColor
      textColor
      position
      animation
      startDate
      endDate
      isActive
    }
  }
`

const CREATE_FLOATING_PROMO = gql`
  mutation CreateFloatingPromo($input: FloatingPromoInput!) {
    createFloatingPromo(input: $input) {
      id
    }
  }
`

const UPDATE_FLOATING_PROMO = gql`
  mutation UpdateFloatingPromo($id: ID!, $input: FloatingPromoInput!) {
    updateFloatingPromo(id: $id, input: $input) {
      id
    }
  }
`

const DELETE_FLOATING_PROMO = gql`
  mutation DeleteFloatingPromo($id: ID!) {
    deleteFloatingPromo(id: $id)
  }
`

const GET_POPULAR_PRODUCTS_CONFIG = gql`
  query GetPopularProductsConfig {
    popularProductsConfig {
      id
      title
      subtitle
      algorithm
      productIds
      maxProducts
      timeRange
      minSales
      showBadge
      badgeText
      badgeColor
      autoRefresh
      refreshInterval
      isActive
    }
  }
`

const UPSERT_POPULAR_PRODUCTS_CONFIG = gql`
  mutation UpsertPopularProductsConfig($input: PopularProductsConfigInput!) {
    upsertPopularProductsConfig(input: $input) {
      id
    }
  }
`

// ==================== 組件類型定義 ====================

const COMPONENT_TYPES = {
  HERO_SLIDER: { name: '輪播圖', icon: '🎬', color: 'bg-purple-500' },
  SALE_COUNTDOWN: { name: '促銷倒計時', icon: '⏰', color: 'bg-red-500' },
  GUARANTEE_BAR: { name: '服務保證欄', icon: '✅', color: 'bg-green-500' },
  FLASH_SALE: { name: '限時搶購', icon: '⚡', color: 'bg-yellow-500' },
  CATEGORY_GRID: { name: '分類網格', icon: '📦', color: 'bg-blue-500' },
  DAILY_DEALS: { name: '每日特價', icon: '💰', color: 'bg-orange-500' },
  SUPER_DEALS: { name: '超值優惠', icon: '🎁', color: 'bg-pink-500' },
  POPULAR_PRODUCTS: { name: '熱門商品', icon: '🔥', color: 'bg-red-600' },
  NEW_ARRIVALS: { name: '新品上架', icon: '🆕', color: 'bg-indigo-500' },
  FEATURED_BRANDS: { name: '精選品牌', icon: '⭐', color: 'bg-purple-600' },
  CUSTOMER_REVIEWS: { name: '客戶評價', icon: '💬', color: 'bg-teal-500' },
  NEWSLETTER: { name: '電子報訂閱', icon: '📧', color: 'bg-gray-600' },
  CUSTOM_BANNER: { name: '自定義橫幅', icon: '🖼️', color: 'bg-cyan-500' },
  CUSTOM_HTML: { name: '自定義 HTML', icon: '💻', color: 'bg-gray-700' },
}

// ==================== 主組件 ====================

export default function HomepageManagementPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // GraphQL 查詢
  const { data: configsData, loading: configsLoading, refetch: refetchConfigs } = useQuery(GET_HOMEPAGE_CONFIGS)
  const { data: heroData, loading: heroLoading, refetch: refetchHero } = useQuery(GET_HERO_SLIDES)
  const { data: countdownData, refetch: refetchCountdown } = useQuery(GET_SALE_COUNTDOWN)
  const { data: guaranteeData, refetch: refetchGuarantee } = useQuery(GET_GUARANTEE_ITEMS)
  const { data: categoryData, refetch: refetchCategories } = useQuery(GET_CATEGORY_DISPLAYS)
  const { data: flashSaleData, refetch: refetchFlashSale } = useQuery(GET_FLASH_SALE)
  const { data: floatingData, refetch: refetchFloating } = useQuery(GET_FLOATING_PROMOS)
  const { data: popularData, refetch: refetchPopular } = useQuery(GET_POPULAR_PRODUCTS_CONFIG)

  // GraphQL 突變
  const [updateHomepageConfig] = useMutation(UPDATE_HOMEPAGE_CONFIG)
  const [updateHomepageConfigOrder] = useMutation(UPDATE_HOMEPAGE_CONFIG_ORDER)
  const [createHeroSlide] = useMutation(CREATE_HERO_SLIDE)
  const [updateHeroSlide] = useMutation(UPDATE_HERO_SLIDE)
  const [deleteHeroSlide] = useMutation(DELETE_HERO_SLIDE)
  const [upsertSaleCountdown] = useMutation(UPSERT_SALE_COUNTDOWN)
  const [upsertGuaranteeItems] = useMutation(UPSERT_GUARANTEE_ITEMS)
  const [updateCategoryDisplay] = useMutation(UPDATE_CATEGORY_DISPLAY)
  const [upsertFlashSale] = useMutation(UPSERT_FLASH_SALE)
  const [createFloatingPromo] = useMutation(CREATE_FLOATING_PROMO)
  const [updateFloatingPromo] = useMutation(UPDATE_FLOATING_PROMO)
  const [deleteFloatingPromo] = useMutation(DELETE_FLOATING_PROMO)
  const [upsertPopularProductsConfig] = useMutation(UPSERT_POPULAR_PRODUCTS_CONFIG)

  // 處理拖放排序
  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const items = Array.from(configsData?.homepageConfigs || [])
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // 更新排序
    const configs = items.map((item, index) => ({
      componentId: item.componentId,
      sortOrder: index,
    }))

    try {
      await updateHomepageConfigOrder({ variables: { configs } })
      await refetchConfigs()
      alert('排序已更新')
    } catch (error) {
      alert(`更新失敗：${error.message}`)
    }
  }

  // 切換組件啟用狀態
  const toggleComponentActive = async (componentId, isActive) => {
    try {
      await updateHomepageConfig({
        variables: {
          componentId,
          input: { isActive: !isActive },
        },
      })
      await refetchConfigs()
    } catch (error) {
      alert(`更新失敗：${error.message}`)
    }
  }

  // 初始化組件配置
  useEffect(() => {
    // 確保所有組件類型都有配置
    const ensureAllComponentsExist = async () => {
      const existingConfigs = configsData?.homepageConfigs || []
      const existingTypes = existingConfigs.map(c => c.componentType)

      for (const [type, info] of Object.entries(COMPONENT_TYPES)) {
        if (!existingTypes.includes(type)) {
          // 創建缺少的組件配置
          await updateHomepageConfig({
            variables: {
              componentId: type.toLowerCase(),
              input: {
                componentType: type,
                title: info.name,
                isActive: false,
                sortOrder: 999,
                settings: {},
              },
            },
          })
        }
      }
      refetchConfigs()
    }

    if (configsData && !configsLoading) {
      ensureAllComponentsExist()
    }
  }, [configsData, configsLoading])

  const configs = configsData?.homepageConfigs || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">首頁管理系統</h1>
            <p className="mt-2 text-sm text-gray-600">
              完整控制首頁的每個組件，拖放排序、啟用/停用、自定義內容
            </p>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 導航 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                組件總覽
              </button>
              <button
                onClick={() => setActiveTab('hero')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hero'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                輪播圖管理
              </button>
              <button
                onClick={() => setActiveTab('promotions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'promotions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                促銷設定
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                產品展示
              </button>
              <button
                onClick={() => setActiveTab('others')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'others'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                其他設定
              </button>
            </nav>
          </div>
        </div>

        {/* Tab 內容 */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">組件總覽與排序</h2>
            <p className="text-gray-600 mb-6">拖放組件來調整顯示順序，點擊開關來啟用或停用組件</p>

            {configsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="components">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {configs
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((config, index) => {
                          const componentInfo = COMPONENT_TYPES[config.componentType] || {
                            name: config.componentType,
                            icon: '📄',
                            color: 'bg-gray-500',
                          }

                          return (
                            <Draggable
                              key={config.componentId}
                              draggableId={config.componentId}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-4 bg-white border rounded-lg ${
                                    snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                                  } ${config.isActive ? 'border-green-500' : 'border-gray-300'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      {/* 拖動手柄 */}
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-move text-gray-400 hover:text-gray-600"
                                      >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                      </div>

                                      {/* 組件圖標和名稱 */}
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`w-10 h-10 ${componentInfo.color} rounded-lg flex items-center justify-center text-white text-xl`}
                                        >
                                          {componentInfo.icon}
                                        </div>
                                        <div>
                                          <h3 className="font-semibold text-gray-900">
                                            {config.title || componentInfo.name}
                                          </h3>
                                          <p className="text-sm text-gray-500">
                                            {config.subtitle || `ID: ${config.componentId}`}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                      {/* 編輯按鈕 */}
                                      <button
                                        onClick={() => {
                                          setSelectedComponent(config)
                                          setActiveTab(
                                            config.componentType === 'HERO_SLIDER'
                                              ? 'hero'
                                              : config.componentType.includes('SALE') ||
                                                config.componentType.includes('DEAL')
                                              ? 'promotions'
                                              : config.componentType.includes('PRODUCT')
                                              ? 'products'
                                              : 'others'
                                          )
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900"
                                      >
                                        編輯
                                      </button>

                                      {/* 啟用開關 */}
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="sr-only peer"
                                          checked={config.isActive}
                                          onChange={() => toggleComponentActive(config.componentId, config.isActive)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                          {config.isActive ? '啟用' : '停用'}
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* 組件狀態指示器 */}
                                  {config.isActive && (
                                    <div className="mt-3 flex items-center space-x-4 text-sm">
                                      <span className="text-green-600">✓ 顯示在首頁</span>
                                      <span className="text-gray-500">排序：{config.sortOrder + 1}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        )}

        {activeTab === 'hero' && <HeroSlideManager />}
        {activeTab === 'promotions' && <PromotionsManager />}
        {activeTab === 'products' && <ProductsDisplayManager />}
        {activeTab === 'others' && <OthersManager />}
      </div>
    </div>
  )
}

// ==================== 子組件：輪播圖管理 ====================

function HeroSlideManager() {
  const { data, loading, refetch } = useQuery(GET_HERO_SLIDES)
  const [createHeroSlide] = useMutation(CREATE_HERO_SLIDE)
  const [updateHeroSlide] = useMutation(UPDATE_HERO_SLIDE)
  const [deleteHeroSlide] = useMutation(DELETE_HERO_SLIDE)
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)

  const handleSubmit = async (formData) => {
    try {
      if (editingSlide) {
        await updateHeroSlide({
          variables: {
            id: editingSlide.id,
            input: formData,
          },
        })
      } else {
        await createHeroSlide({
          variables: { input: formData },
        })
      }
      await refetch()
      setShowForm(false)
      setEditingSlide(null)
      alert('保存成功')
    } catch (error) {
      alert(`保存失敗：${error.message}`)
    }
  }

  const handleDelete = async (id, title) => {
    if (confirm(`確定要刪除輪播圖「${title}」嗎？`)) {
      try {
        await deleteHeroSlide({ variables: { id } })
        await refetch()
        alert('刪除成功')
      } catch (error) {
        alert(`刪除失敗：${error.message}`)
      }
    }
  }

  const slides = data?.heroSlides || []

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">輪播圖管理</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + 新增輪播圖
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>尚未設定輪播圖</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {slides.map((slide) => (
            <div key={slide.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{slide.title}</h3>
                    {slide.subtitle && <p className="text-sm text-gray-600">{slide.subtitle}</p>}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        slide.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {slide.isActive ? '啟用' : '停用'}
                      </span>
                      <span className="text-xs text-gray-500">排序：{slide.sortOrder}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingSlide(slide)
                      setShowForm(true)
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id, slide.title)}
                    className="text-red-600 hover:text-red-900"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表單彈窗 */}
      {showForm && (
        <HeroSlideForm
          slide={editingSlide}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingSlide(null)
          }}
        />
      )}
    </div>
  )
}

// 輪播圖表單組件
function HeroSlideForm({ slide, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    description: slide?.description || '',
    image: slide?.image || '',
    mobileImage: slide?.mobileImage || '',
    cta: slide?.cta || '立即購買',
    ctaSecondary: slide?.ctaSecondary || '',
    link: slide?.link || '/products',
    linkSecondary: slide?.linkSecondary || '',
    textColor: slide?.textColor || '#FFFFFF',
    bgColor: slide?.bgColor || '',
    overlayOpacity: slide?.overlayOpacity || 0.3,
    textPosition: slide?.textPosition || 'CENTER_LEFT',
    sortOrder: slide?.sortOrder || 0,
    isActive: slide?.isActive ?? true,
    startDate: slide?.startDate || null,
    endDate: slide?.endDate || null,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6">
          {slide ? '編輯輪播圖' : '新增輪播圖'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                標題 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">副標題</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述文字</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                桌面版圖片 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">手機版圖片 URL</label>
              <input
                type="url"
                value={formData.mobileImage}
                onChange={(e) => setFormData({ ...formData, mobileImage: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                主按鈕文字 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                主按鈕連結 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">次要按鈕文字</label>
              <input
                type="text"
                value={formData.ctaSecondary}
                onChange={(e) => setFormData({ ...formData, ctaSecondary: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">次要按鈕連結</label>
              <input
                type="text"
                value={formData.linkSecondary}
                onChange={(e) => setFormData({ ...formData, linkSecondary: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">文字顏色</label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-full h-10 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">背景顏色</label>
              <input
                type="color"
                value={formData.bgColor || '#000000'}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-full h-10 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">遮罩透明度</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.overlayOpacity}
                onChange={(e) => setFormData({ ...formData, overlayOpacity: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">文字位置</label>
              <select
                value={formData.textPosition}
                onChange={(e) => setFormData({ ...formData, textPosition: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="TOP_LEFT">左上</option>
                <option value="TOP_CENTER">中上</option>
                <option value="TOP_RIGHT">右上</option>
                <option value="CENTER_LEFT">左中</option>
                <option value="CENTER">正中</option>
                <option value="CENTER_RIGHT">右中</option>
                <option value="BOTTOM_LEFT">左下</option>
                <option value="BOTTOM_CENTER">中下</option>
                <option value="BOTTOM_RIGHT">右下</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">排序</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">開始時間</label>
              <input
                type="datetime-local"
                value={formData.startDate ? formData.startDate.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">結束時間</label>
              <input
                type="datetime-local"
                value={formData.endDate ? formData.endDate.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm">
              啟用此輪播圖
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              {slide ? '更新' : '創建'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== 子組件：促銷設定管理 ====================

function PromotionsManager() {
  return (
    <div className="space-y-6">
      <SaleCountdownManager />
      <FlashSaleManager />
      <DailyDealsManager />
      <SuperDealsManager />
    </div>
  )
}

// 促銷倒計時管理
function SaleCountdownManager() {
  const { data, loading, refetch } = useQuery(GET_SALE_COUNTDOWN)
  const [upsertSaleCountdown] = useMutation(UPSERT_SALE_COUNTDOWN)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (formData) => {
    try {
      await upsertSaleCountdown({
        variables: { input: formData },
      })
      await refetch()
      setShowForm(false)
      alert('保存成功')
    } catch (error) {
      alert(`保存失敗：${error.message}`)
    }
  }

  const countdown = data?.activeSaleCountdown

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">促銷倒計時</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {countdown ? '編輯' : '設定'}倒計時
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : countdown ? (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-2">{countdown.title}</h3>
          {countdown.subtitle && <p className="mb-4">{countdown.subtitle}</p>}
          <div className="flex items-center space-x-4">
            <span>結束時間：</span>
            <span className="font-mono text-lg">
              {new Date(countdown.endTime).toLocaleString()}
            </span>
          </div>
          {countdown.link && (
            <div className="mt-4">
              <span>連結：{countdown.link}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>尚未設定促銷倒計時</p>
        </div>
      )}

      {showForm && (
        <SaleCountdownForm
          countdown={countdown}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// 促銷倒計時表單
function SaleCountdownForm({ countdown, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: countdown?.title || '限時特賣',
    subtitle: countdown?.subtitle || '',
    endTime: countdown?.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    bgColor: countdown?.bgColor || '#FF0000',
    textColor: countdown?.textColor || '#FFFFFF',
    link: countdown?.link || '',
    isActive: countdown?.isActive ?? true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6">設定促銷倒計時</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">副標題</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              結束時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={new Date(formData.endTime).toISOString().slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">背景顏色</label>
              <input
                type="color"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-full h-10 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">文字顏色</label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-full h-10 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">連結</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="/flash-sale"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 限時搶購管理
function FlashSaleManager() {
  const { data, loading, refetch } = useQuery(GET_FLASH_SALE)
  const [upsertFlashSale] = useMutation(UPSERT_FLASH_SALE)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (formData) => {
    try {
      await upsertFlashSale({
        variables: { input: formData },
      })
      await refetch()
      setShowForm(false)
      alert('保存成功')
    } catch (error) {
      alert(`保存失敗：${error.message}`)
    }
  }

  const flashSale = data?.activeFlashSale

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">限時搶購</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {flashSale ? '編輯' : '設定'}限時搶購
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : flashSale ? (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">{flashSale.name}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">開始時間：</span>
              <span className="ml-2">{new Date(flashSale.startTime).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">結束時間：</span>
              <span className="ml-2">{new Date(flashSale.endTime).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">產品數量：</span>
              <span className="ml-2">{flashSale.products?.length || 0} 個</span>
            </div>
            <div>
              <span className="text-gray-600">最大顯示：</span>
              <span className="ml-2">{flashSale.maxProducts} 個</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>尚未設定限時搶購</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">設定限時搶購</h2>
            <p className="text-gray-600 mb-4">功能開發中...</p>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 每日特價管理
function DailyDealsManager() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">每日特價</h2>
      <p className="text-gray-600">功能開發中...</p>
    </div>
  )
}

// 超值優惠管理
function SuperDealsManager() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">超值優惠</h2>
      <p className="text-gray-600">功能開發中...</p>
    </div>
  )
}

// ==================== 子組件：產品展示管理 ====================

function ProductsDisplayManager() {
  return (
    <div className="space-y-6">
      <PopularProductsManager />
      <FeaturedProductsManager />
      <NewArrivalsManager />
    </div>
  )
}

// 熱門產品管理
function PopularProductsManager() {
  const { data, loading, refetch } = useQuery(GET_POPULAR_PRODUCTS_CONFIG)
  const [upsertPopularProductsConfig] = useMutation(UPSERT_POPULAR_PRODUCTS_CONFIG)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (formData) => {
    try {
      await upsertPopularProductsConfig({
        variables: { input: formData },
      })
      await refetch()
      setShowForm(false)
      alert('保存成功')
    } catch (error) {
      alert(`保存失敗：${error.message}`)
    }
  }

  const config = data?.popularProductsConfig

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">熱門產品設定</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {config ? '編輯' : '設定'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : config ? (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">{config.title}</h3>
          {config.subtitle && <p className="text-gray-600 mb-4">{config.subtitle}</p>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">算法：</span>
              <span className="ml-2 font-semibold">
                {config.algorithm === 'MANUAL' && '手動選擇'}
                {config.algorithm === 'SALES_VOLUME' && '銷量排序'}
                {config.algorithm === 'VIEW_COUNT' && '瀏覽次數'}
                {config.algorithm === 'RATING' && '評分排序'}
                {config.algorithm === 'TRENDING' && '綜合趨勢'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">最大顯示：</span>
              <span className="ml-2">{config.maxProducts} 個</span>
            </div>
            {config.showBadge && (
              <div>
                <span className="text-gray-600">標籤：</span>
                <span
                  className="ml-2 px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: config.badgeColor }}
                >
                  {config.badgeText}
                </span>
              </div>
            )}
            {config.autoRefresh && (
              <div>
                <span className="text-gray-600">自動更新：</span>
                <span className="ml-2">每 {config.refreshInterval} 小時</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>尚未設定熱門產品</p>
        </div>
      )}

      {showForm && (
        <PopularProductsForm
          config={config}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// 熱門產品表單
function PopularProductsForm({ config, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: config?.title || '熱門商品',
    subtitle: config?.subtitle || '',
    algorithm: config?.algorithm || 'MANUAL',
    productIds: config?.productIds || [],
    maxProducts: config?.maxProducts || 12,
    timeRange: config?.timeRange || 30,
    minSales: config?.minSales || 0,
    showBadge: config?.showBadge ?? true,
    badgeText: config?.badgeText || 'HOT',
    badgeColor: config?.badgeColor || '#FF0000',
    autoRefresh: config?.autoRefresh || false,
    refreshInterval: config?.refreshInterval || 24,
    isActive: config?.isActive ?? true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6">設定熱門產品</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                標題 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">副標題</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              選擇算法 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.algorithm}
              onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="MANUAL">手動選擇產品</option>
              <option value="SALES_VOLUME">根據銷量自動選擇</option>
              <option value="VIEW_COUNT">根據瀏覽次數自動選擇</option>
              <option value="RATING">根據評分自動選擇</option>
              <option value="TRENDING">綜合趨勢（推薦）</option>
            </select>
          </div>

          {formData.algorithm === 'MANUAL' && (
            <div>
              <label className="block text-sm font-medium mb-1">選擇產品</label>
              <p className="text-sm text-gray-600 mb-2">請輸入產品 ID（以逗號分隔）</p>
              <textarea
                value={formData.productIds.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  productIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                })}
                className="w-full border rounded-lg px-3 py-2"
                rows="3"
                placeholder="product1, product2, product3"
              />
            </div>
          )}

          {formData.algorithm === 'SALES_VOLUME' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">統計時間範圍（天）</label>
                <input
                  type="number"
                  value={formData.timeRange}
                  onChange={(e) => setFormData({ ...formData, timeRange: parseInt(e.target.value) || 30 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">最低銷量門檻</label>
                <input
                  type="number"
                  value={formData.minSales}
                  onChange={(e) => setFormData({ ...formData, minSales: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">最大顯示產品數</label>
            <input
              type="number"
              value={formData.maxProducts}
              onChange={(e) => setFormData({ ...formData, maxProducts: parseInt(e.target.value) || 12 })}
              className="w-full border rounded-lg px-3 py-2"
              min="1"
              max="50"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">標籤設定</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showBadge"
                  checked={formData.showBadge}
                  onChange={(e) => setFormData({ ...formData, showBadge: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="showBadge" className="ml-2 text-sm">
                  顯示熱門標籤
                </label>
              </div>

              {formData.showBadge && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">標籤文字</label>
                    <input
                      type="text"
                      value={formData.badgeText}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">標籤顏色</label>
                    <input
                      type="color"
                      value={formData.badgeColor}
                      onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                      className="w-full h-10 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">自動更新設定</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={formData.autoRefresh}
                  onChange={(e) => setFormData({ ...formData, autoRefresh: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="autoRefresh" className="ml-2 text-sm">
                  自動更新產品列表
                </label>
              </div>

              {formData.autoRefresh && (
                <div className="ml-6">
                  <label className="block text-sm font-medium mb-1">更新間隔（小時）</label>
                  <input
                    type="number"
                    value={formData.refreshInterval}
                    onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) || 24 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="1"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              保存設定
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 精選產品管理
function FeaturedProductsManager() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">精選產品</h2>
      <p className="text-gray-600">使用現有的精選產品功能管理</p>
    </div>
  )
}

// 新品上架管理
function NewArrivalsManager() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">新品上架</h2>
      <p className="text-gray-600">使用現有的新品展示功能管理</p>
    </div>
  )
}

// ==================== 子組件：其他設定管理 ====================

function OthersManager() {
  return (
    <div className="space-y-6">
      <GuaranteeBarManager />
      <CategoryGridManager />
      <FloatingPromoManager />
    </div>
  )
}

// 服務保證欄管理
function GuaranteeBarManager() {
  const { data, loading, refetch } = useQuery(GET_GUARANTEE_ITEMS)
  const [upsertGuaranteeItems] = useMutation(UPSERT_GUARANTEE_ITEMS)
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (data?.guaranteeItems) {
      setItems(data.guaranteeItems)
    }
  }, [data])

  const handleSubmit = async () => {
    try {
      await upsertGuaranteeItems({
        variables: { items },
      })
      await refetch()
      setShowForm(false)
      alert('保存成功')
    } catch (error) {
      alert(`保存失敗：${error.message}`)
    }
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        icon: '✅',
        title: '新項目',
        description: '',
        link: '',
        isActive: true,
      },
    ])
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">服務保證欄</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          編輯項目
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div key={index} className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>尚未設定服務保證項目</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">編輯服務保證項目</h2>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">圖標</label>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => handleUpdateItem(index, 'icon', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">標題</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">描述</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddItem}
              className="mt-4 text-indigo-600 hover:text-indigo-900"
            >
              + 新增項目
            </button>

            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                保存
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 分類網格管理
function CategoryGridManager() {
  const { data, loading } = useQuery(GET_CATEGORY_DISPLAYS)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">分類網格</h2>
      <p className="text-gray-600">管理首頁顯示的產品分類</p>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mt-4">
          {data?.categoryDisplays?.map((display) => (
            <div key={display.id} className="border rounded-lg p-3 text-center">
              <div className="text-2xl mb-2">{display.icon || '📦'}</div>
              <h3 className="font-semibold">
                {display.displayName || display.category.name}
              </h3>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 浮動促銷按鈕管理
function FloatingPromoManager() {
  const { data, loading, refetch } = useQuery(GET_FLOATING_PROMOS)
  const [createFloatingPromo] = useMutation(CREATE_FLOATING_PROMO)
  const [updateFloatingPromo] = useMutation(UPDATE_FLOATING_PROMO)
  const [deleteFloatingPromo] = useMutation(DELETE_FLOATING_PROMO)

  const promos = data?.activeFloatingPromos || []

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">浮動促銷按鈕</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + 新增按鈕
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>尚未設定浮動按鈕</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo) => (
            <div key={promo.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: promo.bgColor }}
                >
                  {promo.icon || '🎁'}
                </div>
                <div>
                  <h3 className="font-semibold">{promo.text}</h3>
                  <p className="text-sm text-gray-600">
                    位置：{promo.position} | 連結：{promo.link}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-indigo-600 hover:text-indigo-900">編輯</button>
                <button className="text-red-600 hover:text-red-900">刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}