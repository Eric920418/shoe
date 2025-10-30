'use client'

import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

// ==================== GraphQL Queries ====================

const GET_HERO_SLIDES = gql`
  query GetHeroSlides {
    heroSlides {
      id
      title
      subtitle
      description
      image
      cta
      link
      sortOrder
      isActive
    }
  }
`

const GET_PRODUCTS = gql`
  query GetProducts($where: JSON) {
    products(where: $where) {
      id
      name
      slug
      price
      originalPrice
      images
      isFeatured
      isNewArrival
      sortOrder
      features
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
      title
      subtitle
      description
      image
      cta
      link
      sortOrder
      isActive
    }
  }
`

const UPDATE_HERO_SLIDE = gql`
  mutation UpdateHeroSlide($id: ID!, $input: UpdateHeroSlideInput!) {
    updateHeroSlide(id: $id, input: $input) {
      id
      title
      subtitle
      description
      image
      cta
      link
      sortOrder
      isActive
    }
  }
`

const DELETE_HERO_SLIDE = gql`
  mutation DeleteHeroSlide($id: ID!) {
    deleteHeroSlide(id: $id)
  }
`

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      isFeatured
      sortOrder
    }
  }
`

// ==================== 類型定義 ====================

interface HeroSlideFormData {
  title: string
  subtitle: string
  description: string
  image: string
  cta: string
  link: string
  sortOrder: number
  isActive: boolean
}

interface HeroSlide extends HeroSlideFormData {
  id: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string
  isFeatured: boolean
  isNewArrival: boolean
  sortOrder: number
  features?: string
  category?: { name: string }
}

// ==================== 主組件 ====================

export default function HomepageManagementPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'featured' | 'newarrival'>('hero')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [formData, setFormData] = useState<HeroSlideFormData>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    cta: '立即探索',
    link: '/products',
    sortOrder: 0,
    isActive: true,
  })

  // Queries
  const { data: heroData, loading: heroLoading, refetch: refetchHero } = useQuery(GET_HERO_SLIDES, {
    fetchPolicy: 'network-only',
  })

  const { data: productsData, loading: productsLoading, refetch: refetchProducts } = useQuery(GET_PRODUCTS, {
    variables: { where: { isActive: true } },
    fetchPolicy: 'network-only',
  })

  // Mutations
  const [createHeroSlide, { loading: creating }] = useMutation(CREATE_HERO_SLIDE, {
    onCompleted: () => {
      alert('輪播圖創建成功！')
      setShowCreateModal(false)
      resetForm()
      refetchHero()
    },
    onError: (error) => alert(`創建失敗：${error.message}`),
  })

  const [updateHeroSlide, { loading: updating }] = useMutation(UPDATE_HERO_SLIDE, {
    onCompleted: () => {
      alert('輪播圖更新成功！')
      setShowCreateModal(false)
      setEditingSlide(null)
      resetForm()
      refetchHero()
    },
    onError: (error) => alert(`更新失敗：${error.message}`),
  })

  const [deleteHeroSlide] = useMutation(DELETE_HERO_SLIDE, {
    onCompleted: () => {
      alert('輪播圖已刪除')
      refetchHero()
    },
    onError: (error) => alert(`刪除失敗：${error.message}`),
  })

  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
    onCompleted: () => {
      refetchProducts()
    },
    onError: (error) => alert(`更新失敗：${error.message}`),
  })

  // ==================== 輪播圖處理函數 ====================

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      cta: '立即探索',
      link: '/products',
      sortOrder: 0,
      isActive: true,
    })
    setEditingSlide(null)
  }

  const handleCreate = () => {
    setShowCreateModal(true)
    resetForm()
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      image: slide.image,
      cta: slide.cta,
      link: slide.link,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`確定要刪除輪播圖「${title}」嗎？`)) return
    await deleteHeroSlide({ variables: { id } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.image || !formData.cta || !formData.link) {
      alert('請填寫所有必填欄位')
      return
    }

    if (editingSlide) {
      await updateHeroSlide({
        variables: { id: editingSlide.id, input: formData },
      })
    } else {
      await createHeroSlide({
        variables: { input: formData },
      })
    }
  }

  // ==================== 產品處理函數 ====================

  const toggleFeatured = async (product: Product) => {
    // 如果要設為精選，檢查是否已達上限
    if (!product.isFeatured && featuredProducts.length >= 4) {
      alert('最多只能選擇 4 個精選產品！請先取消其他產品的精選狀態。')
      return
    }

    await updateProduct({
      variables: {
        id: product.id,
        input: { isFeatured: !product.isFeatured },
      },
    })
  }

  const updateProductSort = async (productId: string, sortOrder: number) => {
    await updateProduct({
      variables: {
        id: productId,
        input: { sortOrder },
      },
    })
  }

  const toggleNewArrival = async (product: Product) => {
    // 如果要設為新品展示，檢查是否已有其他產品
    if (!product.isNewArrival) {
      const currentNewArrival = products.find(p => p.isNewArrival)
      if (currentNewArrival) {
        if (!confirm(`目前「${currentNewArrival.name}」是新品展示，確定要改為「${product.name}」嗎？`)) {
          return
        }
        // 先取消舊的
        await updateProduct({
          variables: {
            id: currentNewArrival.id,
            input: { isNewArrival: false },
          },
        })
      }
    }

    await updateProduct({
      variables: {
        id: product.id,
        input: { isNewArrival: !product.isNewArrival },
      },
    })
  }

  const parseImages = (images: string): string[] => {
    try {
      const parsed = typeof images === 'string' ? JSON.parse(images) : images
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // ==================== 渲染 ====================

  const slides: HeroSlide[] = heroData?.heroSlides || []
  const products: Product[] = productsData?.products || []
  const featuredProducts = products.filter(p => p.isFeatured).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">首頁內容管理</h1>
        <p className="mt-2 text-gray-600">管理首頁輪播圖、精選產品與新品展示</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'hero'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🎬 輪播圖管理
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'featured'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ⭐ 精選產品 ({featuredProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('newarrival')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'newarrival'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🆕 新品展示
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'hero' && (
        <HeroSlidesTab
          slides={slides}
          loading={heroLoading}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {activeTab === 'featured' && (
        <FeaturedProductsTab
          products={products}
          featuredProducts={featuredProducts}
          loading={productsLoading}
          onToggleFeatured={toggleFeatured}
          onUpdateSort={updateProductSort}
          parseImages={parseImages}
        />
      )}

      {activeTab === 'newarrival' && (
        <NewArrivalTab
          products={products}
          loading={productsLoading}
          onToggleNewArrival={toggleNewArrival}
          parseImages={parseImages}
        />
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <HeroSlideModal
          formData={formData}
          setFormData={setFormData}
          editingSlide={editingSlide}
          creating={creating}
          updating={updating}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowCreateModal(false)
            resetForm()
          }}
        />
      )}
    </div>
  )
}

// ==================== Tab Components ====================

function HeroSlidesTab({ slides, loading, onCreate, onEdit, onDelete }: any) {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">管理首頁主視覺輪播圖</p>
        <button
          onClick={onCreate}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          + 新增輪播圖
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
          <p className="text-lg">目前沒有輪播圖</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">預覽</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">標題</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">副標題</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">按鈕</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slides.map((slide: any) => (
                <tr key={slide.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img src={slide.image} alt={slide.title} className="h-16 w-28 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{slide.title}</div>
                    {slide.description && <div className="text-sm text-gray-500 truncate max-w-xs">{slide.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm">{slide.subtitle || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{slide.cta}</div>
                    <div className="text-xs text-gray-500">{slide.link}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{slide.sortOrder}</td>
                  <td className="px-6 py-4">
                    {slide.isActive ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">啟用</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">停用</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => onEdit(slide)} className="text-blue-600 hover:text-blue-900 mr-4">編輯</button>
                    <button onClick={() => onDelete(slide.id, slide.title)} className="text-red-600 hover:text-red-900">刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FeaturedProductsTab({ products, featuredProducts, loading, onToggleFeatured, onUpdateSort, parseImages }: any) {
  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📌 使用說明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 勾選產品設為「精選」，將顯示在首頁「精選推薦」區塊</li>
          <li>• 調整「排序」數字控制顯示順序（數字越小越前面）</li>
          <li>• <strong>最多只能選擇 4 個產品作為精選</strong></li>
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">
          已選精選產品 ({featuredProducts.length}/4)
          {featuredProducts.length >= 4 && (
            <span className="ml-2 text-sm text-red-600 font-normal">已達上限</span>
          )}
        </h3>
        {featuredProducts.length === 0 ? (
          <p className="text-gray-500">尚未選擇精選產品</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {featuredProducts.map((product: Product) => {
              const images = parseImages(product.images)
              return (
                <div key={product.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <img src={images[0]} alt={product.name} className="w-full h-32 object-cover rounded mb-2" />
                  <div className="text-sm font-medium truncate">{product.name}</div>
                  <div className="text-xs text-gray-500">排序: {product.sortOrder}</div>
                  <input
                    type="number"
                    value={product.sortOrder}
                    onChange={(e) => onUpdateSort(product.id, parseInt(e.target.value) || 0)}
                    className="mt-2 w-full border rounded px-2 py-1 text-sm"
                    placeholder="排序"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2 mt-6">所有產品</h3>
      {loading ? (
        <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">精選</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">圖片</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">產品名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分類</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">價格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product: Product) => {
                const images = parseImages(product.images)
                const isDisabled = !product.isFeatured && featuredProducts.length >= 4
                return (
                  <tr key={product.id} className={product.isFeatured ? 'bg-yellow-50' : isDisabled ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={product.isFeatured}
                        onChange={() => onToggleFeatured(product)}
                        disabled={isDisabled}
                        className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <img src={images[0] || '/placeholder.jpg'} alt={product.name} className="h-16 w-16 object-cover rounded" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">NT$ {Number(product.price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {product.isFeatured && (
                        <input
                          type="number"
                          value={product.sortOrder}
                          onChange={(e) => onUpdateSort(product.id, parseInt(e.target.value) || 0)}
                          className="w-20 border rounded px-2 py-1 text-sm"
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NewArrivalTab({ products, loading, onToggleNewArrival, parseImages }: any) {
  const newArrivalProduct = products.find((p: Product) => p.isNewArrival)

  const parseFeatures = (features: string): Array<{label: string, value: string}> => {
    try {
      const parsed = typeof features === 'string' ? JSON.parse(features) : features
      if (Array.isArray(parsed)) {
        // 如果是字串陣列，轉換為物件格式
        return parsed.map((f: any) => {
          if (typeof f === 'string') {
            return { label: f, value: f }
          }
          return { label: f.label || f.name || '', value: f.value || f.name || '' }
        })
      }
      return []
    } catch {
      return []
    }
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">📌 使用說明</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 「新品搶先體驗」區塊會顯示你選擇的新品產品</li>
          <li>• <strong>只能選擇 1 個產品作為新品展示</strong></li>
          <li>• 確保產品有設定特性（features），會顯示在首頁</li>
          <li>• 如果產品沒有特性，首頁會顯示預設文案</li>
        </ul>
      </div>

      {/* 當前選中的新品 */}
      {newArrivalProduct && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">當前新品展示</h3>
          <div className="bg-white rounded-lg p-6 border-2 border-purple-500 shadow-lg">
            <div className="flex gap-6">
              <img
                src={parseImages(newArrivalProduct.images)[0] || '/placeholder.jpg'}
                alt={newArrivalProduct.name}
                className="w-48 h-48 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">{newArrivalProduct.category?.name || '未分類'}</div>
                <h4 className="font-bold text-2xl mb-2">{newArrivalProduct.name}</h4>
                <div className="text-xl font-bold text-purple-600 mb-4">
                  NT$ {Number(newArrivalProduct.price).toLocaleString()}
                </div>

                {/* 顯示特性 */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">產品特性：</div>
                  {newArrivalProduct.features ? (
                    <div className="grid grid-cols-2 gap-3">
                      {parseFeatures(newArrivalProduct.features).slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-lg p-3">
                          <div className="text-xs text-purple-600 font-semibold">{feature.label}</div>
                          {feature.value !== feature.label && (
                            <div className="text-sm font-bold text-purple-900">{feature.value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">此產品尚未設定特性</div>
                  )}
                </div>

                <button
                  onClick={() => onToggleNewArrival(newArrivalProduct)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  取消新品展示
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 產品選擇列表 */}
      <h3 className="font-semibold text-lg mb-4 mt-6">選擇新品展示產品</h3>
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">選擇</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">圖片</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">產品名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分類</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">價格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">特性數量</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product: Product) => {
                const images = parseImages(product.images)
                const features = parseFeatures(product.features || '')
                return (
                  <tr key={product.id} className={product.isNewArrival ? 'bg-purple-50' : ''}>
                    <td className="px-6 py-4">
                      <input
                        type="radio"
                        name="newArrival"
                        checked={product.isNewArrival}
                        onChange={() => onToggleNewArrival(product)}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <img src={images[0] || '/placeholder.jpg'} alt={product.name} className="h-16 w-16 object-cover rounded" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">NT$ {Number(product.price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      {features.length > 0 ? (
                        <span className="text-green-600 font-semibold">{features.length} 個特性</span>
                      ) : (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== Modal Component ====================

function HeroSlideModal({ formData, setFormData, editingSlide, creating, updating, onSubmit, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{editingSlide ? '編輯輪播圖' : '新增輪播圖'}</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">標題 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="例如：釋放你的潛能" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">副標題</label>
              <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="例如：全新科技 · 極致體驗" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述文字</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="例如：突破界限，超越自我" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">圖片 URL <span className="text-red-500">*</span></label>
              <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="https://images.unsplash.com/..." required />
              {formData.image && <img src={formData.image} alt="預覽" className="mt-2 w-full h-48 object-cover rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">按鈕文字 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.cta} onChange={(e) => setFormData({ ...formData, cta: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="例如：立即探索" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">按鈕連結 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="/products" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">排序</label>
              <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-4 py-2" min="0" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
              <label htmlFor="isActive" className="ml-2 text-sm">啟用此輪播圖</label>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={creating || updating} className="flex-1 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400">
                {creating || updating ? '處理中...' : editingSlide ? '更新' : '創建'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">取消</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
