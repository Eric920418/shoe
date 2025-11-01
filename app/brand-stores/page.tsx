'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Store, Shield, Award, Star, ChevronRight } from 'lucide-react'

export default function BrandStoresPage() {
  const brandStores = [
    {
      id: 'nike',
      name: 'Nike 旗艦店',
      logo: '/api/placeholder/120/60',
      followers: '10.5萬',
      products: 856,
      rating: 4.9,
      bgColor: 'from-black to-gray-800',
      verified: true
    },
    {
      id: 'adidas',
      name: 'Adidas 官方店',
      logo: '/api/placeholder/120/60',
      followers: '8.3萬',
      products: 723,
      rating: 4.8,
      bgColor: 'from-gray-900 to-black',
      verified: true
    },
    {
      id: 'newbalance',
      name: 'New Balance 專賣店',
      logo: '/api/placeholder/120/60',
      followers: '6.7萬',
      products: 542,
      rating: 4.8,
      bgColor: 'from-red-700 to-gray-900',
      verified: true
    },
    {
      id: 'puma',
      name: 'Puma 直營店',
      logo: '/api/placeholder/120/60',
      followers: '5.2萬',
      products: 435,
      rating: 4.7,
      bgColor: 'from-black to-red-900',
      verified: true
    },
    {
      id: 'converse',
      name: 'Converse 官方旗艦',
      logo: '/api/placeholder/120/60',
      followers: '7.8萬',
      products: 328,
      rating: 4.7,
      bgColor: 'from-gray-800 to-red-700',
      verified: true
    },
    {
      id: 'vans',
      name: 'Vans 品牌館',
      logo: '/api/placeholder/120/60',
      followers: '4.9萬',
      products: 267,
      rating: 4.6,
      bgColor: 'from-red-600 to-black',
      verified: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Store className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">品牌旗艦店</h1>
            <p className="opacity-90">官方授權，正品保證</p>
          </div>
        </div>
      </div>

      {/* 品牌保證 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
            <span className="flex items-center gap-2">
              <Shield size={16} className="text-blue-500" />
              100%正品
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <Award size={16} className="text-purple-500" />
              官方授權
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <Store size={16} className="text-green-500" />
              品牌直營
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 品牌店鋪網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandStores.map((store) => (
            <Link
              key={store.id}
              href={`/brands/${store.id}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
            >
              {/* 店鋪頭部 */}
              <div className={`h-32 bg-gradient-to-r ${store.bgColor} p-4 relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex items-center justify-between h-full">
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">{store.name}</h3>
                    {store.verified && (
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-1 rounded text-xs text-white">
                        <Shield size={12} />
                        官方認證
                      </div>
                    )}
                  </div>
                  <div className="w-20 h-12 bg-white/10 rounded flex items-center justify-center">
                    <Image
                      src={store.logo}
                      alt={store.name}
                      width={80}
                      height={40}
                      className="opacity-80"
                    />
                  </div>
                </div>
              </div>

              {/* 店鋪信息 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-current" size={16} />
                    <span className="font-bold">{store.rating}</span>
                    <span className="text-sm text-gray-500">店鋪評分</span>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" size={20} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">商品</p>
                    <p className="font-bold text-gray-800">{store.products}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">粉絲</p>
                    <p className="font-bold text-gray-800">{store.followers}</p>
                  </div>
                </div>

                <button className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium transition-colors">
                  進入旗艦店
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}