'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import toast from 'react-hot-toast'
import {
  Save, Plus, Trash2, Edit, Clock, Image as ImageIcon,
  Tag, ShoppingBag, Star, Gift, Megaphone, Package
} from 'lucide-react'

// GraphQL 查詢和變更
const GET_HOMEPAGE_DATA = gql`
  query GetHomepageData {
    heroSlides {
      id
      title
      subtitle
      description
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
    latestFlashSale {
      id
      name
      startTime
      endTime
      bgColor
      products
      maxProducts
      isActive
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

  // Mutations
  const [createHeroSlide] = useMutation(CREATE_HERO_SLIDE)
  const [updateHeroSlide] = useMutation(UPDATE_HERO_SLIDE)
  const [deleteHeroSlide] = useMutation(DELETE_HERO_SLIDE)
  const [upsertSaleCountdown] = useMutation(UPSERT_SALE_COUNTDOWN)
  const [upsertFlashSale] = useMutation(UPSERT_FLASH_SALE)
  const [upsertPopularProducts] = useMutation(UPSERT_POPULAR_PRODUCTS)
  const [upsertDailyDeal] = useMutation(UPSERT_DAILY_DEAL)

  // 輪播圖管理
  const [editingSlide, setEditingSlide] = useState(null)
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    description: '',
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
  const [flashSaleForm, setFlashSaleForm] = useState({
    title: '限時搶購',
    description: '每2小時更新一次商品',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    discountPercentage: 50,
    maxProducts: 6,
    selectedProducts: []
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
        linkUrl: '/flash-sale',
        buttonText: '立即搶購',
        bgColor: 'from-red-500 to-orange-500',
        tag: '限時特賣'
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

  // 處理限時搶購保存
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

      await upsertFlashSale({
        variables: {
          input: {
            name: flashSaleForm.title,  // title → name
            startTime,
            endTime,
            bgColor: '#FF6B6B',  // 預設顏色
            products,  // JSON 格式
            maxProducts: flashSaleForm.maxProducts,
            isActive: true
          }
        }
      })
      toast.success('限時搶購已更新')
      refetch()
    } catch (error) {
      console.error('限時搶購保存錯誤:', error)
      toast.error(`保存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
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

      if (data.latestFlashSale) {
        // 解析 products JSON（可能是字符串或對象）
        let productsData = {}
        try {
          productsData = typeof data.latestFlashSale.products === 'string'
            ? JSON.parse(data.latestFlashSale.products)
            : (data.latestFlashSale.products || {})
        } catch (e) {
          console.error('解析 products JSON 失敗:', e)
          productsData = {}
        }

        setFlashSaleForm({
          title: data.latestFlashSale.name,  // name → title (前端顯示用)
          description: productsData.description || '每2小時更新一次商品',
          startTime: new Date(data.latestFlashSale.startTime).toISOString().slice(0, 16),
          endTime: new Date(data.latestFlashSale.endTime).toISOString().slice(0, 16),
          discountPercentage: productsData.discountPercentage || 50,
          maxProducts: data.latestFlashSale.maxProducts,
          selectedProducts: productsData.productIds || []
        })
      }

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">首頁內容管理</h1>
        <p className="text-gray-600 mt-2">管理首頁的促銷活動內容和產品推薦</p>
      </div>

      {/* Tab 切換 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'hero', label: '輪播圖', icon: ImageIcon },
            { id: 'countdown', label: '促銷倒計時', icon: Clock },
            { id: 'flash', label: '限時搶購', icon: Tag },
            { id: 'daily', label: '今日特價', icon: Package },
            { id: 'popular', label: '熱門產品', icon: Star },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={20} className="mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 輪播圖管理 */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="text-indigo-600" />
              輪播圖管理
            </h2>

            {/* 現有輪播圖列表 */}
            <div className="space-y-3 mb-6">
              {data?.heroSlides?.map((slide) => (
                <div key={slide.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{slide.title}</h3>
                    <p className="text-sm text-gray-600">{slide.subtitle}</p>
                    <p className="text-xs text-gray-500 mt-1">{slide.description}</p>
                  </div>
                  <div className="flex gap-2">
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
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 新增/編輯表單 */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">
                {editingSlide ? '編輯輪播圖' : '新增輪播圖'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
                    背景顏色
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
                        linkUrl: '/flash-sale',
                        buttonText: '立即搶購',
                        bgColor: 'from-red-500 to-orange-500',
                        tag: '限時特賣'
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-indigo-600" />
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tag className="text-indigo-600" />
            限時搶購設定
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活動標題
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
                  開始時間
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
                  結束時間
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
            </div>

            {/* 商品選擇器 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇商品
              </label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {productsData?.products?.map((product) => (
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
                            selectedProducts: flashSaleForm.selectedProducts.filter(id => id !== product.id)
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

            <button
              onClick={handleSaveFlashSale}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save size={18} />
              保存設定
            </button>
          </div>
        </div>
      )}

      {/* 今日特價 */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" />
            今日特價設定
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="text-indigo-600" />
            熱門產品設定
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
    </div>
  )
}