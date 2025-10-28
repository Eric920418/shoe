/**
 * 產品列表頁 - 顯示所有鞋類產品
 */

import { Metadata } from 'next'
import ProductListClient from './ProductListClient'

export const metadata: Metadata = {
  title: '所有商品 - 鞋店電商',
  description: '瀏覽我們的鞋類商品系列，包含運動鞋、皮鞋、靴子等各式鞋款',
}

export default function ProductsPage() {
  return <ProductListClient />
}
