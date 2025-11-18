/**
 * GraphQL 查詢定義
 */

import { gql } from '@apollo/client'

// ============================================
// 產品相關查詢
// ============================================

export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      price
      originalPrice
      stock
      images
      features
      shoeType
      gender
      season
      heelHeight
      closure
      sole
      category {
        id
        name
        slug
      }
      brand {
        id
        name
        logo
      }
      variants {
        id
        name
        color
        colorHex
        colorImage
        stock
        priceAdjustment
        isActive
      }
      sizeCharts {
        id
        eu
        us
        uk
        cm
        footLength
        footWidth
        stock
        isActive
      }
      reviews {
        id
        rating
        content
        images
        sizeFit
        boughtSize
        user {
          name
          avatar
        }
        createdAt
      }
    }
  }
`

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      name
      slug
      description
      price
      originalPrice
      stock
      images
      features
      shoeType
      gender
      season
      heelHeight
      closure
      sole
      isActive
      category {
        id
        name
      }
      brand {
        id
        name
      }
    }
  }
`

export const GET_PRODUCTS = gql`
  query GetProducts(
    $skip: Int
    $take: Int
    $categoryId: String
    $brandId: String
    $minPrice: Float
    $maxPrice: Float
    $gender: ProductGender
    $search: String
  ) {
    products(
      skip: $skip
      take: $take
      categoryId: $categoryId
      brandId: $brandId
      minPrice: $minPrice
      maxPrice: $maxPrice
      gender: $gender
      search: $search
    ) {
      id
      name
      slug
      price
      originalPrice
      images
      totalStock
      brand {
        name
      }
      category {
        name
      }
    }
  }
`

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      isActive
      productCount
    }
  }
`

export const GET_BRANDS = gql`
  query GetBrands {
    brands {
      id
      name
      slug
      logo
      website
      country
      isActive
      isFeatured
      productCount
    }
  }
`

// 首頁展示用產品查詢（包含銷售數據）
export const GET_HOMEPAGE_PRODUCTS = gql`
  query GetHomepageProducts(
    $skip: Int
    $take: Int
    $categoryId: String
    $brandId: String
    $minPrice: Float
    $maxPrice: Float
    $gender: ProductGender
    $search: String
  ) {
    products(
      skip: $skip
      take: $take
      categoryId: $categoryId
      brandId: $brandId
      minPrice: $minPrice
      maxPrice: $maxPrice
      gender: $gender
      search: $search
    ) {
      id
      name
      slug
      price
      originalPrice
      images
      stock
      soldCount
      viewCount
      averageRating
      reviewCount
      brand {
        name
      }
      category {
        name
      }
    }
  }
`

// ============================================
// 購物車相關查詢
// ============================================

export const GET_CART = gql`
  query GetCart {
    cart {
      id
      items {
        id
        quantity
        price
        addedPrice
        subtotal
        sizeEu
        bundleId
        isBundleItem
        bundleItemPrice
        product {
          id
          name
          slug
          images
          brand {
            name
          }
        }
        variant {
          color
          colorHex
        }
        sizeChart {
          eu
          us
          uk
          cm
        }
        bundle {
          id
          name
          slug
          discount
          discountPercent
        }
      }
      total
      totalItems
    }
  }
`

// ============================================
// 購物車相關 Mutations
// ============================================

export const ADD_TO_CART = gql`
  mutation AddToCart(
    $productId: ID!
    $variantId: ID
    $sizeChartId: ID!
    $quantity: Int!
  ) {
    addToCart(
      productId: $productId
      variantId: $variantId
      sizeChartId: $sizeChartId
      quantity: $quantity
    ) {
      id
      items {
        id
        quantity
        subtotal
      }
      total
      totalItems
    }
  }
`

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($cartItemId: ID!, $quantity: Int!) {
    updateCartItem(cartItemId: $cartItemId, quantity: $quantity) {
      id
      items {
        id
        quantity
        subtotal
      }
      total
      totalItems
    }
  }
`

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartItemId: ID!) {
    removeFromCart(cartItemId: $cartItemId) {
      id
      items {
        id
      }
      total
      totalItems
    }
  }
`

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart {
      id
      total
      totalItems
    }
  }
`

// ============================================
// 認證相關 Mutations
// ============================================

export const REGISTER = gql`
  mutation Register($phone: String!, $name: String!) {
    register(phone: $phone, name: $name) {
      token
      user {
        id
        email
        name
        phone
        role
      }
    }
  }
`

export const LOGIN = gql`
  mutation Login($phone: String!) {
    login(phone: $phone) {
      token
      user {
        id
        email
        name
        phone
        role
      }
    }
  }
`

// ============================================
// 訂單相關查詢
// ============================================

export const GET_MY_ORDERS = gql`
  query GetMyOrders {
    myOrders {
      id
      orderNumber
      status
      paymentStatus
      total
      subtotal
      shippingFee
      createdAt
      shippingName
      shippingPhone
      shippingCity
      shippingDistrict
      items {
        id
        quantity
        price
        subtotal
        productName
        productImage
        sizeEu
        color
        product {
          id
          name
          slug
          images
        }
      }
    }
  }
`

// 獲取所有訂單（管理員專用）
export const GET_ALL_ORDERS = gql`
  query GetAllOrders($skip: Int, $take: Int, $where: JSON) {
    orders(skip: $skip, take: $take, where: $where) {
      id
      orderNumber
      status
      paymentStatus
      paymentMethod
      shippingStatus
      total
      subtotal
      shippingFee
      discount
      createdAt
      updatedAt
      paidAt
      shippedAt
      deliveredAt
      shippingName
      shippingPhone
      shippingCity
      shippingDistrict
      shippingStreet
      notes
      guestName
      guestPhone
      guestEmail
      user {
        id
        name
        email
        phone
      }
      items {
        id
        quantity
        price
        subtotal
        productName
        productImage
        sizeEu
        color
      }
    }
  }
`

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      paymentStatus
      paymentMethod
      shippingStatus
      shippingMethod
      trackingNumber
      total
      subtotal
      shippingFee
      discount
      createdAt
      paidAt
      shippedAt
      deliveredAt
      shippingName
      shippingPhone
      shippingCountry
      shippingCity
      shippingDistrict
      shippingStreet
      shippingZipCode
      notes
      guestName
      guestPhone
      guestEmail
      user {
        id
        name
        email
        phone
      }
      payment {
        id
        merchantOrderNo
        tradeNo
        amount
        status
        paymentType
        paymentTypeName
        errorMessage
        errorCode
        responseData
        atmBankCode
        atmVirtualAccount
        atmExpireDate
        cvsBankCode
        cvsPaymentNo
        cvsExpireDate
        card4No
        card6No
        authBank
        payTime
        createdAt
      }
      items {
        id
        quantity
        price
        subtotal
        productName
        productImage
        sizeEu
        color
        product {
          id
          name
          slug
          images
          brand {
            name
          }
        }
        variant {
          id
          color
          colorHex
        }
      }
    }
  }
`

// ============================================
// 訂單相關 Mutations
// ============================================

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      paymentStatus
      total
      createdAt
    }
  }
`

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!, $reason: String) {
    cancelOrder(id: $id, reason: $reason) {
      id
      orderNumber
      status
      cancelReason
      cancelledAt
    }
  }
`

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: ID!) {
    deleteOrder(id: $id) {
      success
      message
    }
  }
`

// 更新訂單狀態（管理員專用）
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      orderNumber
      status
      paymentStatus
      shippingStatus
      updatedAt
    }
  }
`

// 訪客訂單追蹤（不需要登入）
export const TRACK_ORDER = gql`
  query TrackOrder($orderNumber: String!, $phone: String!) {
    trackOrder(orderNumber: $orderNumber, phone: $phone) {
      id
      orderNumber
      status
      paymentStatus
      shippingStatus
      paymentMethod
      subtotal
      shippingFee
      discount
      total
      shippingName
      shippingPhone
      shippingCity
      shippingDistrict
      shippingStreet
      shippingZipCode
      trackingNumber
      notes
      createdAt
      paidAt
      shippedAt
      deliveredAt
      items {
        id
        productName
        productImage
        variantName
        sizeEu
        color
        quantity
        price
        subtotal
      }
    }
  }
`

// ============================================
// 用戶相關查詢
// ============================================

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      phone
      name
      role
      avatar
      birthday
      gender
      membershipTier
      membershipPoints
      totalOrders
      totalSpent
      createdAt
      addresses {
        id
        name
        phone
        country
        city
        district
        street
        zipCode
        isDefault
      }
    }
  }
`

export const GET_MY_ADDRESSES = gql`
  query GetMyAddresses {
    myAddresses {
      id
      name
      phone
      country
      city
      district
      street
      zipCode
      isDefault
      createdAt
      updatedAt
    }
  }
`

export const GET_ADDRESS = gql`
  query GetAddress($id: ID!) {
    address(id: $id) {
      id
      name
      phone
      country
      city
      district
      street
      zipCode
      isDefault
      createdAt
      updatedAt
    }
  }
`

// ============================================
// 用戶相關 Mutations
// ============================================

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      phone
      name
      avatar
      birthday
      gender
    }
  }
`

export const CREATE_ADDRESS = gql`
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
      name
      phone
      country
      city
      district
      street
      zipCode
      isDefault
    }
  }
`

export const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($id: ID!, $input: UpdateAddressInput!) {
    updateAddress(id: $id, input: $input) {
      id
      name
      phone
      country
      city
      district
      street
      zipCode
      isDefault
    }
  }
`

export const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: ID!) {
    deleteAddress(id: $id)
  }
`

export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($id: ID!) {
    setDefaultAddress(id: $id) {
      id
      isDefault
    }
  }
`

// ============================================
// 評論相關查詢
// ============================================

export const GET_PRODUCT_REVIEWS = gql`
  query GetProductReviews($productId: ID!, $skip: Int, $take: Int) {
    productReviews(productId: $productId, skip: $skip, take: $take) {
      id
      rating
      title
      content
      images
      sizeFit
      boughtSize
      verified
      helpfulCount
      createdAt
      user {
        id
        name
        avatar
      }
    }
  }
`

export const GET_MY_REVIEWS = gql`
  query GetMyReviews {
    myReviews {
      id
      rating
      title
      content
      images
      sizeFit
      boughtSize
      verified
      isApproved
      createdAt
      product {
        id
        name
        images
      }
    }
  }
`

// ============================================
// 評論相關 Mutations
// ============================================

export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      rating
      title
      content
      images
      sizeFit
      boughtSize
      verified
      createdAt
    }
  }
`

// ============================================
// 優惠券相關查詢
// ============================================

export const GET_PUBLIC_COUPONS = gql`
  query GetPublicCoupons {
    publicCoupons {
      id
      code
      name
      description
      type
      value
      minAmount
      maxDiscount
      usageLimit
      usedCount
      userLimit
      isActive
      validFrom
      validUntil
    }
  }
`

export const GET_MY_COUPONS = gql`
  query GetMyCoupons {
    myCoupons {
      id
      isUsed
      usedAt
      expiresAt
      obtainedFrom
      createdAt
      coupon {
        id
        code
        name
        description
        type
        value
        minAmount
        maxDiscount
        validFrom
        validUntil
      }
    }
  }
`

export const GET_AVAILABLE_COUPONS = gql`
  query GetAvailableCoupons {
    availableCoupons {
      id
      isUsed
      expiresAt
      createdAt
      coupon {
        id
        code
        name
        description
        type
        value
        minAmount
        maxDiscount
        validFrom
        validUntil
      }
    }
  }
`

export const VALIDATE_COUPON = gql`
  query ValidateCoupon($code: String!, $orderAmount: Float!) {
    validateCoupon(code: $code, orderAmount: $orderAmount) {
      valid
      message
      discountAmount
      coupon {
        id
        code
        name
        type
        value
        minAmount
        maxDiscount
      }
    }
  }
`

// ============================================
// 優惠券相關 Mutations
// ============================================

export const CLAIM_COUPON = gql`
  mutation ClaimCoupon($code: String!) {
    claimCoupon(code: $code) {
      id
      isUsed
      expiresAt
      obtainedFrom
      createdAt
      coupon {
        id
        code
        name
        description
        type
        value
        minAmount
        maxDiscount
        validFrom
        validUntil
      }
    }
  }
`

// ============================================
// 產品管理相關 Mutations（管理員）
// ============================================

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      slug
      description
      price
      originalPrice
      stock
      isActive
      shoeType
      gender
      season
      heelHeight
      closure
      sole
      features
      category {
        id
        name
      }
      brand {
        id
        name
      }
      createdAt
    }
  }
`

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      price
      originalPrice
      stock
      isActive
      isFeatured
      shoeType
      gender
      season
      updatedAt
    }
  }
`

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`

// 分類管理
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      slug
      sortOrder
      isActive
      createdAt
    }
  }
`

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      sortOrder
      isActive
      updatedAt
    }
  }
`

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`

// 品牌管理
export const CREATE_BRAND = gql`
  mutation CreateBrand($input: CreateBrandInput!) {
    createBrand(input: $input) {
      id
      name
      slug
      logo
      website
      country
      sortOrder
      isActive
      isFeatured
      createdAt
    }
  }
`

export const UPDATE_BRAND = gql`
  mutation UpdateBrand($id: ID!, $input: UpdateBrandInput!) {
    updateBrand(id: $id, input: $input) {
      id
      name
      logo
      website
      country
      sortOrder
      isActive
      isFeatured
      updatedAt
    }
  }
`

export const DELETE_BRAND = gql`
  mutation DeleteBrand($id: ID!) {
    deleteBrand(id: $id)
  }
`

// ============================================
// 願望清單相關查詢
// ============================================

export const GET_MY_WISHLIST = gql`
  query GetMyWishlist {
    myWishlist {
      id
      productId
      createdAt
      product {
        id
        name
        slug
        price
        originalPrice
        stock
        images
        isActive
        isFeatured
        favoriteCount
        shoeType
        gender
        category {
          id
          name
          slug
        }
        brand {
          id
          name
          logo
        }
        variants {
          id
          color
          colorHex
          stock
          isActive
        }
        sizeCharts {
          id
          eu
          us
          uk
          cm
          stock
          isActive
        }
      }
    }
  }
`

export const IS_IN_WISHLIST = gql`
  query IsInWishlist($productId: ID!) {
    isInWishlist(productId: $productId)
  }
`

export const ADD_TO_WISHLIST = gql`
  mutation AddToWishlist($productId: ID!) {
    addToWishlist(productId: $productId) {
      id
      productId
      createdAt
      product {
        id
        name
        slug
        price
        originalPrice
        images
        favoriteCount
      }
    }
  }
`

export const REMOVE_FROM_WISHLIST = gql`
  mutation RemoveFromWishlist($id: ID!) {
    removeFromWishlist(id: $id)
  }
`

export const REMOVE_FROM_WISHLIST_BY_PRODUCT = gql`
  mutation RemoveFromWishlistByProduct($productId: ID!) {
    removeFromWishlistByProduct(productId: $productId)
  }
`

export const CLEAR_WISHLIST = gql`
  mutation ClearWishlist {
    clearWishlist
  }
`

export const TOGGLE_WISHLIST = gql`
  mutation ToggleWishlist($productId: ID!) {
    toggleWishlist(productId: $productId) {
      isInWishlist
      message
    }
  }
`

// ============================================
// 購物金相關查詢
// ============================================

export const GET_AVAILABLE_CREDIT_AMOUNT = gql`
  query GetAvailableCreditAmount {
    availableCreditAmount
  }
`

export const GET_MY_CREDITS = gql`
  query GetMyCredits {
    myCredits {
      id
      amount
      balance
      source
      description
      validFrom
      validUntil
      minOrderAmount
      maxUsagePerOrder
      isUsed
      isActive
      createdAt
    }
  }
`

// ============================================
// 用戶統計相關查詢
// ============================================

export const GET_SHIPPED_ORDERS = gql`
  query GetShippedOrders {
    myOrders {
      id
      status
    }
  }
`

// ============================================
// 尺碼管理相關查詢
// ============================================

export const GET_PRODUCT_SIZE_CHARTS = gql`
  query GetProductSizeCharts($productId: ID!, $variantId: ID) {
    productSizeChart(productId: $productId, variantId: $variantId) {
      id
      productId
      variantId
      eu
      us
      uk
      cm
      footLength
      footWidth
      stock
      isActive
      createdAt
      updatedAt
    }
  }
`

export const CREATE_SIZE_CHART = gql`
  mutation CreateSizeChart($input: CreateSizeChartInput!) {
    createSizeChart(input: $input) {
      id
      productId
      variantId
      eu
      us
      uk
      cm
      footLength
      footWidth
      stock
      isActive
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_SIZE_CHART = gql`
  mutation UpdateSizeChart($id: ID!, $input: UpdateSizeChartInput!) {
    updateSizeChart(id: $id, input: $input) {
      id
      productId
      variantId
      eu
      us
      uk
      cm
      footLength
      footWidth
      stock
      isActive
      updatedAt
    }
  }
`

export const DELETE_SIZE_CHART = gql`
  mutation DeleteSizeChart($id: ID!) {
    deleteSizeChart(id: $id)
  }
`

// ============================================
// Dashboard 儀表板相關查詢（管理員專用）
// ============================================

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalOrders
      totalRevenue
      totalProducts
      totalUsers
      ordersToday
      revenueToday
      pendingOrders
      lowStockProducts
      revenueGrowth
      newUsersThisMonth
    }
  }
`

export const GET_RECENT_ORDERS = gql`
  query GetRecentOrders($limit: Int) {
    recentOrders(limit: $limit) {
      id
      orderNumber
      customer
      total
      status
      createdAt
    }
  }
`
