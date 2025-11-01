'use client'

import React from 'react'
import { Shield, Truck, RefreshCw, HeadphonesIcon, CreditCard, Award } from 'lucide-react'

const GuaranteeBar = () => {
  const guarantees = [
    {
      icon: Shield,
      title: '100%正品',
      description: '假一賠十',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Truck,
      title: '全館免運',
      description: '滿$399即享',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: RefreshCw,
      title: '7天鑑賞',
      description: '不滿意包退',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: HeadphonesIcon,
      title: '24H客服',
      description: '隨時為您服務',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: CreditCard,
      title: '安全支付',
      description: '多元付款方式',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Award,
      title: '會員優惠',
      description: 'VIP專屬折扣',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 my-3 sm:my-4">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
        {guarantees.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex flex-col items-center text-center group cursor-pointer">
              <div className={`${item.bgColor} p-2 sm:p-3 rounded-full mb-1 sm:mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className={item.color} size={18} />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-800">{item.title}</h4>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GuaranteeBar