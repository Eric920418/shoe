'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Gift, Star, ShoppingCart, Package } from 'lucide-react'

export default function GiftsPage() {
  const gifts = [
    {
      id: 1,
      title: '滿$999送購物袋',
      description: '精美品牌購物袋，限量贈送',
      minAmount: 999,
      image: '/api/placeholder/300/200',
      stock: '剩餘 200 份'
    },
    {
      id: 2,
      title: '滿$1999送鞋墊組',
      description: '頂級運動鞋墊，舒適加倍',
      minAmount: 1999,
      image: '/api/placeholder/300/200',
      stock: '剩餘 150 份'
    },
    {
      id: 3,
      title: '滿$2999送清潔組',
      description: '專業鞋類清潔保養組',
      minAmount: 2999,
      image: '/api/placeholder/300/200',
      stock: '剩餘 100 份'
    }
  ]

  const products = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `贈品活動商品 ${i + 1}`,
    price: 999 + i * 200,
    originalPrice: 1999 + i * 400,
    rating: (4.5 + Math.random() * 0.4).toFixed(1),
    image: '/api/placeholder/300/300'
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Gift className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">滿額贈品專區</h1>
            <p className="opacity-90">消費滿額即送精美好禮</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 贈品方案 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {gifts.map((gift) => (
            <div key={gift.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg mb-3 flex items-center justify-center">
                <Package size={48} className="text-pink-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{gift.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-pink-600 font-medium">{gift.stock}</span>
                <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded">滿 ${gift.minAmount}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 參加活動的商品 */}
        <h2 className="text-xl font-bold mb-4">參加滿額贈活動商品</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <Link href={`/products/${product.id}`}>
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    送禮
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="text-yellow-400 fill-current" size={12} />
                    <span className="text-xs text-gray-600">{product.rating}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">${product.originalPrice}</p>
                      <p className="text-lg font-bold text-pink-600">${product.price}</p>
                    </div>
                    <button className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}