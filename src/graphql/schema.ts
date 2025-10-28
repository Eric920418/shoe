/**
 * GraphQL Schema 定義 - 鞋店電商系統
 */

const gql = String.raw;

export const typeDefs = gql`
  # 純量類型
  scalar DateTime
  scalar Decimal
  scalar JSON

  # ==================== 枚舉類型 ====================
  
  # 用户角色
  enum Role {
    USER
    ADMIN
  }

  # 會員等級配置（動態）
  type MembershipTierConfig {
    id: ID!
    name: String!
    slug: String!
    minSpent: Decimal!
    maxSpent: Decimal
    discount: Decimal!
    pointsMultiplier: Decimal!
    freeShippingThreshold: Decimal!
    birthdayGift: Decimal!
    sortOrder: Int!
    color: String
    icon: String
    description: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 性别
  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  # 產品性別（鞋店專屬）
  enum ProductGender {
    MEN
    WOMEN
    UNISEX
    KIDS
  }

  # 尺码合适度（鞋店專屬）
  enum SizeFit {
    TOO_SMALL
    SLIGHTLY_SMALL
    TRUE_TO_SIZE
    SLIGHTLY_LARGE
    TOO_LARGE
  }

  # 訂單状态
  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    COMPLETED
    CANCELLED
    REFUNDED
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
    BANK_TRANSFER_PENDING
    BANK_TRANSFER_VERIFIED
  }

  enum PaymentMethod {
    BANK_TRANSFER
    LINE_PAY
    CREDIT_CARD
    CASH_ON_DELIVERY
  }

  enum ShippingStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
  }

  # 優惠券類型
  enum CouponType {
    PERCENTAGE
    FIXED
    FREE_SHIPPING
    BUY_X_GET_Y
  }

  # 活動類型（簡化版）
  enum CampaignType {
    PURCHASE_REWARD
    FLASH_SALE
    BUNDLE_DEAL
    SEASONAL
    FIRST_TIME_BUYER
    BIRTHDAY_SPECIAL
  }

  enum CampaignStatus {
    DRAFT
    SCHEDULED
    ACTIVE
    PAUSED
    COMPLETED
    CANCELLED
    EXPIRED
  }

  # 退貨類型
  enum ReturnType {
    RETURN
    EXCHANGE
    REPAIR
  }

  enum ReturnReason {
    DEFECTIVE
    WRONG_ITEM
    SIZE_ISSUE
    NOT_AS_DESCRIBED
    DAMAGED_SHIPPING
    CHANGED_MIND
    OTHER
  }

  enum ReturnStatus {
    REQUESTED
    APPROVED
    REJECTED
    RECEIVED
    PROCESSING
    COMPLETED
    CANCELLED
  }

  enum RefundStatus {
    PENDING
    APPROVED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  # ==================== 核心類型 ====================
  
  # 用戶類型
  type User {
    id: ID!
    email: String!
    phone: String
    name: String!
    firstName: String
    lastName: String
    role: Role!
    avatar: String
    membershipTierConfig: MembershipTierConfig
    membershipPoints: Int!
    membershipExpiredAt: DateTime
    isFirstTimeBuyer: Boolean!
    firstPurchaseAt: DateTime
    birthday: DateTime
    gender: Gender
    preferences: JSON!
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    isActive: Boolean!
    totalOrders: Int!
    totalSpent: Decimal!
    addresses: [Address!]!
    orders: [Order!]!
    cartItems: [CartItem!]!
    reviews: [Review!]!
    userCoupons: [UserCoupon!]!
    wishlistItems: [WishlistItem!]!
    pointTransactions: [PointTransaction!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLogin: DateTime
  }

  # 用戶列表響應類型
  type UsersResponse {
    users: [User!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  # 優惠券列表響應類型
  type CouponsResponse {
    coupons: [Coupon!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  # 地址類型
  type Address {
    id: ID!
    userId: String!
    user: User!
    name: String!
    phone: String!
    country: String!
    city: String!
    district: String!
    street: String!
    zipCode: String!
    isDefault: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 分類類型
  type Category {
    id: ID!
    name: String!
    slug: String!
    image: String
    sortOrder: Int!
    isActive: Boolean!
    products: [Product!]!
    productCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 品牌類型
  type Brand {
    id: ID!
    name: String!
    slug: String!
    logo: String
    website: String
    country: String
    isActive: Boolean!
    isFeatured: Boolean!
    sortOrder: Int!
    products: [Product!]!
    productCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 產品類型（鞋店專屬）
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    price: Decimal!
    originalPrice: Decimal
    cost: Decimal
    stock: Int!
    minStock: Int!
    weight: Decimal
    categoryId: String!
    brandId: String
    images: JSON!
    isActive: Boolean!
    isFeatured: Boolean!
    sortOrder: Int!
    viewCount: Int!
    soldCount: Int!
    averageRating: Decimal
    reviewCount: Int!
    favoriteCount: Int!
    # 鞋店專屬字段
    shoeType: String
    gender: ProductGender
    season: String
    heelHeight: Decimal
    closure: String
    sole: String
    features: JSON
    # 关联
    brand: Brand
    category: Category!
    variants: [ProductVariant!]!
    sizeCharts: [SizeChart!]!
    reviews: [Review!]!
    wishlistItems: [WishlistItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 產品變體（顏色 × 尺碼）
  type ProductVariant {
    id: ID!
    productId: String!
    product: Product!
    name: String!
    barcode: String
    attributes: JSON
    color: String
    colorHex: String
    colorImage: String
    material: String
    pattern: String
    priceAdjustment: Decimal!
    stock: Int!
    reservedStock: Int!
    images: JSON!
    weight: Decimal
    isActive: Boolean!
    isDefault: Boolean!
    sortOrder: Int!
    soldCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 尺码表（鞋店核心）
  type SizeChart {
    id: ID!
    productId: String!
    product: Product!
    variantId: String
    eu: String!
    us: String!
    uk: String!
    cm: String!
    footLength: Decimal!
    footWidth: String
    stock: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 購物車
  type Cart {
    id: ID!
    userId: String!
    items: [CartItem!]!
    total: Float!
    totalItems: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CartItem {
    id: ID!
    cartId: String!
    productId: String!
    variantId: String
    sizeChartId: String!
    quantity: Int!
    price: Decimal!
    subtotal: Float!
    cart: Cart!
    product: Product!
    variant: ProductVariant
    sizeChart: SizeChart!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 訂單
  type Order {
    id: ID!
    orderNumber: String!
    userId: String
    user: User
    guestName: String
    guestPhone: String
    guestEmail: String
    addressId: String
    address: Address
    shippingName: String!
    shippingPhone: String!
    shippingCountry: String!
    shippingCity: String!
    shippingDistrict: String!
    shippingStreet: String!
    shippingZipCode: String
    subtotal: Decimal!
    shippingFee: Decimal!
    discount: Decimal!
    total: Decimal!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    shippingStatus: ShippingStatus!
    paymentMethod: PaymentMethod
    paymentId: String
    paidAt: DateTime
    bankTransferImage: String
    bankTransferNote: String
    bankTransferVerifiedAt: DateTime
    pointsEarned: Int!
    pointsUsed: Int!
    shippingMethod: String
    trackingNumber: String
    shippedAt: DateTime
    deliveredAt: DateTime
    cancelReason: String
    cancelComment: String
    cancelledAt: DateTime
    couponId: String
    coupon: Coupon
    items: [OrderItem!]!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 訂單项
  type OrderItem {
    id: ID!
    orderId: String!
    productId: String!
    productName: String!
    productImage: String
    price: Decimal!
    quantity: Int!
    subtotal: Decimal!
    variantId: String
    variantName: String
    variantAttrs: JSON
    sizeEu: String
    color: String
    order: Order!
    product: Product!
    variant: ProductVariant
    createdAt: DateTime!
  }

  # 優惠券
  type Coupon {
    id: ID!
    code: String!
    name: String!
    description: String
    type: CouponType!
    value: Decimal!
    minAmount: Decimal
    maxDiscount: Decimal
    usageLimit: Int
    usedCount: Int!
    userLimit: Int
    isActive: Boolean!
    applicableCategories: JSON
    applicableProducts: JSON
    excludeProducts: JSON
    isPublic: Boolean!
    validFrom: DateTime!
    validUntil: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 用户優惠券
  type UserCoupon {
    id: ID!
    userId: String!
    couponId: String!
    user: User!
    coupon: Coupon!
    isUsed: Boolean!
    usedAt: DateTime
    orderId: String
    obtainedFrom: String
    expiresAt: DateTime
    createdAt: DateTime!
  }

  # 購物金
  type UserCredit {
    id: ID!
    userId: String!
    user: User!
    amount: Decimal!
    balance: Decimal!
    source: CreditSource!
    sourceId: String
    maxUsagePerOrder: Decimal
    minOrderAmount: Decimal
    validFrom: DateTime!
    validUntil: DateTime!
    isActive: Boolean!
    isUsed: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 購物金来源
  enum CreditSource {
    CAMPAIGN
    REFUND
    ADMIN_GRANT
    BIRTHDAY
    REVIEW
  }

  # 公告類型
  enum AnnouncementType {
    INFO
    SUCCESS
    WARNING
    ERROR
    PROMOTION
    MAINTENANCE
  }

  # 系統公告
  type Announcement {
    id: ID!
    title: String!
    content: String!
    type: AnnouncementType!
    priority: Int!
    isActive: Boolean!
    startDate: DateTime!
    endDate: DateTime
    actionUrl: String
    actionLabel: String
    createdBy: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 公告列表響應
  type AnnouncementsResponse {
    items: [Announcement!]!
    total: Int!
    hasMore: Boolean!
  }

  # 社群連結系統
  type SocialLink {
    id: ID!
    platform: String!
    url: String!
    label: String
    icon: String
    isActive: Boolean!
    sortOrder: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 創建公告輸入
  input CreateAnnouncementInput {
    title: String!
    content: String!
    type: AnnouncementType
    priority: Int
    isActive: Boolean
    startDate: DateTime
    endDate: DateTime
    actionUrl: String
    actionLabel: String
  }

  # 更新公告輸入
  input UpdateAnnouncementInput {
    title: String
    content: String
    type: AnnouncementType
    priority: Int
    isActive: Boolean
    startDate: DateTime
    endDate: DateTime
    actionUrl: String
    actionLabel: String
  }

  # 邀請碼系統
  type ReferralCode {
    id: ID!
    userId: String!
    code: String!
    usedCount: Int!
    rewardAmount: Decimal!
    referrerReward: Decimal!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User
    usages: [ReferralUsage!]!
  }

  type ReferralUsage {
    id: ID!
    referralCodeId: String!
    referrerId: String!
    refereeId: String!
    rewardGranted: Boolean!
    creditId: String
    createdAt: DateTime!
    referralCode: ReferralCode
    referrer: User
    referee: User
  }

  type ReferralCodesResponse {
    items: [ReferralCode!]!
    total: Int!
    hasMore: Boolean!
  }

  type ReferralCodeValidation {
    valid: Boolean!
    message: String!
    rewardAmount: Float
  }

  type UseReferralCodeResponse {
    success: Boolean!
    message: String!
    creditAmount: Float!
  }

  type ReferralStats {
    totalReferrals: Int!
    totalRewards: Float!
    pendingRewards: Float!
  }

  type DeleteResponse {
    success: Boolean!
    message: String
  }

  input UpdateReferralCodeInput {
    rewardAmount: Float
    referrerReward: Float
    isActive: Boolean
  }

  # 聊天室系統
  enum ConversationStatus {
    OPEN
    CLOSED
    RESOLVED
  }

  enum SenderType {
    USER
    ADMIN
  }

  type Conversation {
    id: ID!
    userId: String!
    subject: String
    status: ConversationStatus!
    lastMessageAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User
    messages: [Message!]!
    unreadCount: Int!
  }

  type Message {
    id: ID!
    conversationId: String!
    senderId: String!
    senderType: SenderType!
    content: String!
    isRead: Boolean!
    createdAt: DateTime!
  }

  # 購物金列表響應
  type CreditsResponse {
    credits: [UserCredit!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  # 批量發放購物金響應
  type BatchGrantCreditResponse {
    count: Int!
    credits: [UserCredit!]!
  }

  # 行銷活動
  type Campaign {
    id: ID!
    name: String!
    slug: String!
    description: String
    type: CampaignType!
    rules: JSON!
    conditions: JSON!
    discountRules: JSON!
    startDate: DateTime!
    endDate: DateTime!
    maxParticipants: Int
    maxUsagePerUser: Int!
    maxDiscountAmount: Decimal
    minOrderAmount: Decimal
    status: CampaignStatus!
    priority: Int!
    isActive: Boolean!
    isPublic: Boolean!
    bannerImage: String
    thumbnailImage: String
    participantCount: Int!
    completedCount: Int!
    totalRevenue: Decimal!
    totalDiscount: Decimal!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 退货
  type Return {
    id: ID!
    returnNumber: String!
    orderId: String!
    order: Order!
    type: ReturnType!
    reason: ReturnReason!
    description: String
    images: JSON!
    refundAmount: Decimal!
    refundMethod: String
    refundStatus: RefundStatus!
    refundedAt: DateTime
    returnShippingFee: Decimal!
    trackingNumber: String
    status: ReturnStatus!
    processedBy: String
    processedAt: DateTime
    adminNotes: String
    isSizeIssue: Boolean!
    requestedSize: String
    items: [ReturnItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReturnItem {
    id: ID!
    returnId: String!
    orderItemId: String!
    quantity: Int!
    reason: String
    return: Return!
    orderItem: OrderItem!
    createdAt: DateTime!
  }

  # 評論（含尺码反馈）
  type Review {
    id: ID!
    userId: String!
    productId: String!
    user: User!
    product: Product!
    rating: Int!
    title: String
    content: String!
    images: JSON!
    orderId: String
    verified: Boolean!
    isApproved: Boolean!
    isPublic: Boolean!
    helpfulCount: Int!
    sizeFit: SizeFit
    boughtSize: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 愿望清单
  type WishlistItem {
    id: ID!
    userId: String!
    productId: String!
    user: User!
    product: Product!
    createdAt: DateTime!
  }

  # FAQ
  type Faq {
    id: ID!
    question: String!
    answer: String!
    category: String
    slug: String!
    viewCount: Int!
    helpfulCount: Int!
    isPublished: Boolean!
    priority: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 積分記錄
  type PointTransaction {
    id: ID!
    userId: String!
    user: User!
    type: String!
    amount: Int!
    orderId: String
    description: String!
    createdAt: DateTime!
  }

  # 通知
  type Notification {
    id: ID!
    userId: String!
    user: User!
    type: String!
    title: String!
    message: String!
    data: JSON
    isRead: Boolean!
    isArchived: Boolean!
    relatedId: String
    actionUrl: String
    createdAt: DateTime!
    expiresAt: DateTime
  }

  # ==================== Query ====================

  type Query {
    # 用户相关
    me: User
    userById(id: ID!): User
    users(
      search: String
      role: Role
      membershipTierId: ID
      isActive: Boolean
      page: Int
      limit: Int
    ): UsersResponse!

    # 地址相关
    myAddresses: [Address!]!
    address(id: ID!): Address

    # 產品相關
    product(id: ID, slug: String): Product
    products(
      skip: Int
      take: Int
      categoryId: String
      brandId: String
      minPrice: Float
      maxPrice: Float
      gender: ProductGender
      search: String
      where: JSON
      orderBy: JSON
    ): [Product!]!

    # 分類與品牌
    category(id: ID, slug: String): Category
    categories(where: JSON): [Category!]!
    brand(id: ID, slug: String): Brand
    brands(where: JSON): [Brand!]!

    # 購物車
    cart: Cart

    # 訂單
    order(id: ID, orderNumber: String): Order
    myOrders(skip: Int, take: Int): [Order!]!
    orders(skip: Int, take: Int, where: JSON): [Order!]!

    # 優惠券
    coupon(id: ID, code: String): Coupon
    publicCoupons: [Coupon!]!
    myCoupons: [UserCoupon!]!
    availableCoupons: [UserCoupon!]!
    validateCoupon(code: String!, orderAmount: Float!): CouponValidationResult!
    # Admin: 優惠券管理
    coupons(
      search: String
      type: CouponType
      isActive: Boolean
      page: Int
      limit: Int
    ): CouponsResponse!
    couponById(id: ID!): Coupon

    # 購物金
    myCredits: [UserCredit!]!
    availableCreditAmount: Float!
    # Admin: 購物金管理
    credits(
      userId: String
      source: CreditSource
      isActive: Boolean
      page: Int
      limit: Int
    ): CreditsResponse!

    # 公告
    activeAnnouncements: [Announcement!]!
    # Admin: 公告管理
    announcements(skip: Int, take: Int, where: JSON): AnnouncementsResponse!
    announcement(id: ID!): Announcement

    # 邀請碼
    myReferralCode: ReferralCode!
    validateReferralCode(code: String!): ReferralCodeValidation!
    referralStats: ReferralStats!
    # Admin: 邀請碼管理
    referralCodes(skip: Int, take: Int): ReferralCodesResponse!

    # 聊天室
    myConversations: [Conversation!]!
    conversation(id: ID!): Conversation
    # Admin: 聊天室管理
    allConversations(status: ConversationStatus): [Conversation!]!

    # 評論
    productReviews(productId: ID!, skip: Int, take: Int): [Review!]!
    myReviews: [Review!]!

    # 愿望清单
    myWishlist: [WishlistItem!]!

    # FAQ
    faqs(category: String): [Faq!]!

    # 尺码表
    productSizeChart(productId: ID!, variantId: ID): [SizeChart!]!

    # 社群連結
    socialLinks: [SocialLink!]!
    # Admin: 社群連結管理
    allSocialLinks: [SocialLink!]!

    # 退貨管理
    myReturns: [Return!]!
    returnDetail(id: ID!): Return
    # Admin: 退貨管理
    allReturns(status: ReturnStatus, skip: Int, take: Int): ReturnsResponse!

    # 會員等級管理（Admin）
    membershipTiers: [MembershipTierConfig!]!
    membershipTier(id: ID!): MembershipTierConfig
  }

  # 退貨列表響應
  type ReturnsResponse {
    items: [Return!]!
    total: Int!
    hasMore: Boolean!
  }

  # ==================== Mutation ====================

  type Mutation {
    # LINE Login 認證流程
    getLineLoginUrl: LineLoginUrlResponse!
    lineLoginCallback(code: String!): LineCallbackResponse!
    verifyLineOtp(lineUserId: String!, code: String!, name: String, phone: String): AuthPayload!
    resendLineOtp(lineUserId: String!): ResendOtpResponse!

    # 管理員快速登入（開發/測試用）
    adminQuickLogin(code: String!): AuthPayload!

    # 認證
    register(phone: String!, name: String!): AuthPayload!
    login(identifier: String!, password: String!): AuthPayload!
    
    # 用户资料
    updateProfile(input: UpdateProfileInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!
    
    # 地址管理
    createAddress(input: CreateAddressInput!): Address!
    updateAddress(id: ID!, input: UpdateAddressInput!): Address!
    deleteAddress(id: ID!): Boolean!
    setDefaultAddress(id: ID!): Address!
    
    # 購物車
    addToCart(productId: ID!, variantId: ID, sizeEu: String!, quantity: Int!): CartItem!
    updateCartItem(id: ID!, quantity: Int!): CartItem!
    removeFromCart(id: ID!): Boolean!
    clearCart: Boolean!
    
    # 訂單
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    cancelOrder(id: ID!, reason: String, comment: String): Order!
    uploadBankTransferProof(orderId: ID!, image: String!, note: String): Order!
    
    # 產品管理（管理員）
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # 尺码管理（管理員）
    createSizeChart(input: CreateSizeChartInput!): SizeChart!
    updateSizeChart(id: ID!, input: UpdateSizeChartInput!): SizeChart!
    deleteSizeChart(id: ID!): Boolean!
    
    # 分類管理（管理員）
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    # 品牌管理（管理員）
    createBrand(input: CreateBrandInput!): Brand!
    updateBrand(id: ID!, input: UpdateBrandInput!): Brand!
    deleteBrand(id: ID!): Boolean!

    # 優惠券
    claimCoupon(code: String!): UserCoupon!
    # Admin: 優惠券管理
    createCoupon(input: CreateCouponInput!): Coupon!
    updateCoupon(id: ID!, input: UpdateCouponInput!): Coupon!
    deleteCoupon(id: ID!): Boolean!

    # Admin: 購物金管理
    grantCredit(input: GrantCreditInput!): UserCredit!
    batchGrantCredit(input: BatchGrantCreditInput!): BatchGrantCreditResponse!
    updateCredit(id: ID!, input: UpdateCreditInput!): UserCredit!
    deleteCredit(id: ID!): Boolean!

    # Admin: 公告管理
    createAnnouncement(input: CreateAnnouncementInput!): Announcement!
    updateAnnouncement(id: ID!, input: UpdateAnnouncementInput!): Announcement!
    deleteAnnouncement(id: ID!): DeleteResponse!

    # 邀請碼
    recordReferralVisit(code: String!): JSON!
    useReferralCode(code: String!, userId: String!): UseReferralCodeResponse!
    # Admin: 邀請碼管理
    updateReferralCode(id: ID!, input: UpdateReferralCodeInput!): ReferralCode!

    # 聊天室
    createConversation(subject: String, message: String!): Conversation!
    sendMessage(conversationId: ID!, content: String!): Message!
    # Admin: 聊天室管理
    updateConversationStatus(id: ID!, status: ConversationStatus!): Conversation!

    # 評論
    createReview(input: CreateReviewInput!): Review!

    # 愿望清单
    addToWishlist(productId: ID!): WishlistItem!
    removeFromWishlist(id: ID!): Boolean!

    # 社群連結管理（Admin）
    createSocialLink(input: CreateSocialLinkInput!): SocialLink!
    updateSocialLink(id: ID!, input: UpdateSocialLinkInput!): SocialLink!
    deleteSocialLink(id: ID!): DeleteResponse!

    # 退货
    createReturn(input: CreateReturnInput!): Return!
    updateReturnStatus(id: ID!, input: UpdateReturnStatusInput!): Return!
    uploadReturnTrackingNumber(returnId: ID!, trackingNumber: String!): Return!

    # 會員等級管理（Admin）
    createMembershipTier(input: CreateMembershipTierInput!): MembershipTierConfig!
    updateMembershipTier(id: ID!, input: UpdateMembershipTierInput!): MembershipTierConfig!
    deleteMembershipTier(id: ID!): Boolean!
    recalculateAllMembershipTiers: RecalculateResult!
  }

  # ==================== Response 類型 ====================

  type AuthPayload {
    token: String!
    user: User!
  }

  # LINE Login 相關返回類型
  type LineLoginUrlResponse {
    url: String!
  }

  type LineCallbackResponse {
    lineUserId: String!
    displayName: String!
    pictureUrl: String
    isNewUser: Boolean!
    otpSent: Boolean!
    expiresAt: String!
  }

  type ResendOtpResponse {
    success: Boolean!
    message: String!
    expiresAt: String!
  }

  type CouponValidationResult {
    valid: Boolean!
    message: String!
    coupon: Coupon
    discountAmount: Float
  }

  # ==================== Input 類型 ====================

  input UpdateProfileInput {
    name: String
    firstName: String
    lastName: String
    phone: String
    birthday: DateTime
    gender: Gender
    avatar: String
  }

  input UpdateUserInput {
    name: String
    phone: String
    email: String
    role: Role
    membershipTierId: ID
    membershipPoints: Int
    isActive: Boolean
  }

  input CreateAddressInput {
    name: String!
    phone: String!
    country: String
    city: String!
    district: String!
    street: String!
    zipCode: String!
    isDefault: Boolean
  }

  input UpdateAddressInput {
    name: String
    phone: String
    country: String
    city: String
    district: String
    street: String
    zipCode: String
    isDefault: Boolean
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    shippingName: String!
    shippingPhone: String!
    shippingCountry: String!
    shippingCity: String!
    shippingDistrict: String!
    shippingStreet: String!
    shippingZipCode: String
    paymentMethod: PaymentMethod!
    couponCode: String
    pointsToUse: Int
    creditsToUse: Float
    notes: String
    guestEmail: String
  }

  input OrderItemInput {
    productId: ID!
    variantId: ID
    sizeEu: String!
    quantity: Int!
  }

  input CreateProductInput {
    name: String!
    slug: String
    description: String
    price: Decimal!
    originalPrice: Decimal
    cost: Decimal
    stock: Int!
    categoryId: ID!
    brandId: ID
    images: JSON
    shoeType: String
    gender: ProductGender
    season: String
    heelHeight: Decimal
    closure: String
    sole: String
    features: JSON
  }

  input UpdateProductInput {
    name: String
    slug: String
    description: String
    categoryId: ID
    brandId: ID
    price: Decimal
    originalPrice: Decimal
    stock: Int
    images: JSON
    isActive: Boolean
    isFeatured: Boolean
    shoeType: String
    gender: ProductGender
    season: String
    heelHeight: Decimal
    closure: String
    sole: String
    features: JSON
  }

  input CreateSizeChartInput {
    productId: ID!
    variantId: ID
    eu: String!
    us: String!
    uk: String!
    cm: String!
    footLength: Decimal!
    footWidth: String
    stock: Int!
  }

  input UpdateSizeChartInput {
    eu: String
    us: String
    uk: String
    cm: String
    footLength: Decimal
    footWidth: String
    stock: Int
    isActive: Boolean
  }

  input CreateCategoryInput {
    name: String!
    slug: String
    image: String
    sortOrder: Int
  }

  input UpdateCategoryInput {
    name: String
    slug: String
    image: String
    sortOrder: Int
    isActive: Boolean
  }

  input CreateBrandInput {
    name: String!
    slug: String
    logo: String
    website: String
    country: String
    sortOrder: Int
  }

  input UpdateBrandInput {
    name: String
    slug: String
    logo: String
    website: String
    country: String
    sortOrder: Int
    isActive: Boolean
    isFeatured: Boolean
  }

  input CreateCouponInput {
    code: String!
    name: String!
    description: String
    type: CouponType!
    value: Decimal!
    minAmount: Decimal
    maxDiscount: Decimal
    usageLimit: Int
    userLimit: Int
    validFrom: DateTime!
    validUntil: DateTime!
    isActive: Boolean
    isPublic: Boolean
    applicableCategories: JSON
    applicableProducts: JSON
    excludeProducts: JSON
  }

  input UpdateCouponInput {
    name: String
    description: String
    type: CouponType
    value: Decimal
    minAmount: Decimal
    maxDiscount: Decimal
    usageLimit: Int
    userLimit: Int
    validFrom: DateTime
    validUntil: DateTime
    isActive: Boolean
    isPublic: Boolean
  }

  input GrantCreditInput {
    userId: ID!
    amount: Decimal!
    source: CreditSource
    sourceId: String
    maxUsagePerOrder: Decimal
    minOrderAmount: Decimal
    validFrom: DateTime
    validUntil: DateTime!
    isActive: Boolean
  }

  input BatchGrantCreditInput {
    membershipTierId: ID
    minTotalSpent: Decimal
    amount: Decimal!
    source: CreditSource
    sourceId: String
    maxUsagePerOrder: Decimal
    minOrderAmount: Decimal
    validFrom: DateTime
    validUntil: DateTime!
  }

  input UpdateCreditInput {
    balance: Decimal
    isActive: Boolean
    validUntil: DateTime
  }

  input CreateReviewInput {
    productId: ID!
    orderId: ID
    rating: Int!
    title: String
    content: String!
    images: JSON
    sizeFit: SizeFit
    boughtSize: String
  }

  input CreateReturnInput {
    orderId: ID!
    type: ReturnType!
    reason: ReturnReason!
    description: String
    images: JSON
    items: [ReturnItemInput!]!
    isSizeIssue: Boolean
    requestedSize: String
  }

  input ReturnItemInput {
    orderItemId: ID!
    quantity: Int!
    reason: String
  }

  input UpdateReturnStatusInput {
    status: ReturnStatus!
    trackingNumber: String
    adminNotes: String
    refundAmount: Decimal
  }

  input CreateSocialLinkInput {
    platform: String!
    url: String!
    label: String
    icon: String
    isActive: Boolean
    sortOrder: Int
  }

  input UpdateSocialLinkInput {
    platform: String
    url: String
    label: String
    icon: String
    isActive: Boolean
    sortOrder: Int
  }

  # 會員等級管理 Input
  input CreateMembershipTierInput {
    name: String!
    slug: String!
    minSpent: Decimal!
    maxSpent: Decimal
    discount: Decimal
    pointsMultiplier: Decimal
    freeShippingThreshold: Decimal
    birthdayGift: Decimal
    sortOrder: Int!
    color: String
    icon: String
    description: String
  }

  input UpdateMembershipTierInput {
    name: String
    slug: String
    minSpent: Decimal
    maxSpent: Decimal
    discount: Decimal
    pointsMultiplier: Decimal
    freeShippingThreshold: Decimal
    birthdayGift: Decimal
    sortOrder: Int
    color: String
    icon: String
    description: String
    isActive: Boolean
  }

  # 重算結果類型
  type RecalculateResult {
    success: Boolean!
    message: String!
    updatedCount: Int!
  }
`;
