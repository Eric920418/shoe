/**
 * 產品列表頁 - 顯示所有鞋類產品
 */

import { Metadata } from 'next'
import ModernProductListClient from './ModernProductListClient'
import ModernFooter from '@/components/common/ModernFooter'

export const metadata: Metadata = {
  title: '全部商品 - SHOE STORE',
  description: '探索最新潮流鞋款 - 運動鞋、休閒鞋、籃球鞋等各式鞋款任你選擇',
}

export default function ProductsPage() {
  return (
    <>
      <ModernProductListClient />
      <ModernFooter />
    </>
  )
}
