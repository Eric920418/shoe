'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Truck, Package, Star, ShoppingCart } from 'lucide-react'

export default function FreeShippingPage() {
  const products = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `免運商品 ${i + 1}`,
    price: 999 + i * 100,
    originalPrice: 1999 + i * 200,
    rating: (4.5 + Math.random() * 0.4).toFixed(1),
    reviews: Math.floor(Math.random() * 500) + 100,
    image: '/api/placeholder/300/300',
    freeShipping: true
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Truck className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">免運費專區</h1>
            <p className="opacity-90">全館免運，買越多省越多</p>
          </div>
        </div>
      </div>

      {/* 免運說明 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
            <span className="flex items-center gap-2">
              <Package size={16} className="text-green-500" />
              全館商品免運費
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <Truck size={16} className="text-blue-500" />
              2-5個工作天到貨
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 產品網格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                    <Truck size={12} />
                    免運
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="text-yellow-400 fill-current" size={12} />
                    <span className="text-xs text-gray-600">{product.rating}</span>
                    <span className="text-xs text-gray-400">({product.reviews})</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">${product.originalPrice}</p>
                      <p className="text-lg font-bold text-green-600">${product.price}</p>
                    </div>
                    <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded">
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