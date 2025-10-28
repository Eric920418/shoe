--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Homebrew)
-- Dumped by pg_dump version 16.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: eric
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO eric;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: eric
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CampaignStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."CampaignStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."CampaignStatus" OWNER TO eric;

--
-- Name: CampaignType; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."CampaignType" AS ENUM (
    'PURCHASE_REWARD',
    'FLASH_SALE',
    'BUNDLE_DEAL',
    'SEASONAL',
    'FIRST_TIME_BUYER',
    'BIRTHDAY_SPECIAL'
);


ALTER TYPE public."CampaignType" OWNER TO eric;

--
-- Name: CouponType; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."CouponType" AS ENUM (
    'PERCENTAGE',
    'FIXED',
    'FREE_SHIPPING',
    'BUY_X_GET_Y'
);


ALTER TYPE public."CouponType" OWNER TO eric;

--
-- Name: CreditSource; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."CreditSource" AS ENUM (
    'CAMPAIGN',
    'REFUND',
    'ADMIN_GRANT',
    'BIRTHDAY',
    'REVIEW'
);


ALTER TYPE public."CreditSource" OWNER TO eric;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


ALTER TYPE public."Gender" OWNER TO eric;

--
-- Name: MembershipTier; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."MembershipTier" AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'DIAMOND'
);


ALTER TYPE public."MembershipTier" OWNER TO eric;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."NotificationType" AS ENUM (
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'PRODUCT_BACK_IN_STOCK',
    'PRICE_DROP',
    'PROMOTION',
    'ACCOUNT_UPDATE',
    'SYSTEM_MAINTENANCE',
    'GENERAL'
);


ALTER TYPE public."NotificationType" OWNER TO eric;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO eric;

--
-- Name: ParticipationStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."ParticipationStatus" AS ENUM (
    'REGISTERED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."ParticipationStatus" OWNER TO eric;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'BANK_TRANSFER',
    'LINE_PAY',
    'CREDIT_CARD',
    'CASH_ON_DELIVERY'
);


ALTER TYPE public."PaymentMethod" OWNER TO eric;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'BANK_TRANSFER_PENDING',
    'BANK_TRANSFER_VERIFIED'
);


ALTER TYPE public."PaymentStatus" OWNER TO eric;

--
-- Name: PointTransactionType; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."PointTransactionType" AS ENUM (
    'FIRST_PURCHASE_BONUS',
    'ORDER_REWARD',
    'REFUND',
    'ADMIN_ADJUSTMENT',
    'CAMPAIGN_REWARD'
);


ALTER TYPE public."PointTransactionType" OWNER TO eric;

--
-- Name: ProductGender; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."ProductGender" AS ENUM (
    'MEN',
    'WOMEN',
    'UNISEX',
    'KIDS'
);


ALTER TYPE public."ProductGender" OWNER TO eric;

--
-- Name: RefundStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."RefundStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."RefundStatus" OWNER TO eric;

--
-- Name: ReturnReason; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."ReturnReason" AS ENUM (
    'DEFECTIVE',
    'WRONG_ITEM',
    'SIZE_ISSUE',
    'NOT_AS_DESCRIBED',
    'DAMAGED_SHIPPING',
    'CHANGED_MIND',
    'OTHER'
);


ALTER TYPE public."ReturnReason" OWNER TO eric;

--
-- Name: ReturnStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."ReturnStatus" AS ENUM (
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'RECEIVED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ReturnStatus" OWNER TO eric;

--
-- Name: ReturnType; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."ReturnType" AS ENUM (
    'RETURN',
    'EXCHANGE',
    'REPAIR'
);


ALTER TYPE public."ReturnType" OWNER TO eric;

--
-- Name: RewardStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."RewardStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'GRANTED',
    'FAILED',
    'EXPIRED'
);


ALTER TYPE public."RewardStatus" OWNER TO eric;

--
-- Name: RewardType; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."RewardType" AS ENUM (
    'CREDITS',
    'COUPON',
    'PRODUCT',
    'DISCOUNT',
    'FREE_SHIPPING',
    'MEMBERSHIP_POINTS'
);


ALTER TYPE public."RewardType" OWNER TO eric;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'OPERATOR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO eric;

--
-- Name: ShippingStatus; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."ShippingStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED'
);


ALTER TYPE public."ShippingStatus" OWNER TO eric;

--
-- Name: SizeFit; Type: TYPE; Schema: public; Owner: eric
--

CREATE TYPE public."SizeFit" AS ENUM (
    'TOO_SMALL',
    'SLIGHTLY_SMALL',
    'TRUE_TO_SIZE',
    'SLIGHTLY_LARGE',
    'TOO_LARGE'
);


ALTER TYPE public."SizeFit" OWNER TO eric;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO eric;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    country text DEFAULT '台灣'::text NOT NULL,
    city text NOT NULL,
    district text NOT NULL,
    street text NOT NULL,
    "zipCode" text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.addresses OWNER TO eric;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.brands (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    logo text,
    website text,
    country text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.brands OWNER TO eric;

--
-- Name: campaign_orders; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.campaign_orders (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "orderId" text NOT NULL,
    "userId" text,
    "discountAmount" numeric(10,2) NOT NULL,
    "discountType" text NOT NULL,
    "originalPrice" numeric(10,2) NOT NULL,
    "finalPrice" numeric(10,2) NOT NULL,
    "appliedRules" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.campaign_orders OWNER TO eric;

--
-- Name: campaign_participations; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.campaign_participations (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "userId" text NOT NULL,
    status public."ParticipationStatus" DEFAULT 'REGISTERED'::public."ParticipationStatus" NOT NULL,
    "rewardsEarned" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "rewardsStatus" public."RewardStatus" DEFAULT 'PENDING'::public."RewardStatus" NOT NULL,
    "participatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public.campaign_participations OWNER TO eric;

--
-- Name: campaign_rewards; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.campaign_rewards (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "userId" text NOT NULL,
    "rewardType" public."RewardType" NOT NULL,
    "rewardValue" numeric(10,2),
    "couponId" text,
    "productId" text,
    status public."RewardStatus" DEFAULT 'PENDING'::public."RewardStatus" NOT NULL,
    "earnedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "grantedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.campaign_rewards OWNER TO eric;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.campaigns (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    type public."CampaignType" DEFAULT 'PURCHASE_REWARD'::public."CampaignType" NOT NULL,
    rules jsonb NOT NULL,
    conditions jsonb NOT NULL,
    "discountRules" jsonb NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "maxParticipants" integer,
    "maxUsagePerUser" integer DEFAULT 1,
    "maxDiscountAmount" numeric(10,2),
    "minOrderAmount" numeric(10,2),
    status public."CampaignStatus" DEFAULT 'DRAFT'::public."CampaignStatus" NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "bannerImage" text,
    "thumbnailImage" text,
    "participantCount" integer DEFAULT 0 NOT NULL,
    "completedCount" integer DEFAULT 0 NOT NULL,
    "totalRevenue" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalDiscount" numeric(12,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.campaigns OWNER TO eric;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "addedPrice" numeric(10,2) NOT NULL,
    "variantId" text,
    "sizeEu" text
);


ALTER TABLE public.cart_items OWNER TO eric;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO eric;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.coupons (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    type public."CouponType" DEFAULT 'PERCENTAGE'::public."CouponType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "minAmount" numeric(10,2),
    "maxDiscount" numeric(10,2),
    "usageLimit" integer,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "userLimit" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "applicableCategories" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "applicableProducts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "excludeProducts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.coupons OWNER TO eric;

--
-- Name: faqs; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.faqs (
    id text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text,
    slug text NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "helpfulCount" integer DEFAULT 0 NOT NULL,
    "isPublished" boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.faqs OWNER TO eric;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "relatedId" text,
    "actionUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.notifications OWNER TO eric;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "productName" text NOT NULL,
    "productImage" text,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sku text NOT NULL,
    "variantAttrs" jsonb,
    "variantId" text,
    "variantName" text,
    "sizeEu" text,
    color text
);


ALTER TABLE public.order_items OWNER TO eric;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text,
    "addressId" text,
    subtotal numeric(10,2) NOT NULL,
    "shippingFee" numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "shippingStatus" public."ShippingStatus" DEFAULT 'PENDING'::public."ShippingStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod",
    "paymentId" text,
    "paidAt" timestamp(3) without time zone,
    "shippingMethod" text,
    "trackingNumber" text,
    "shippedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "couponId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "shippingName" text NOT NULL,
    "shippingPhone" text NOT NULL,
    "shippingCountry" text DEFAULT '台灣'::text NOT NULL,
    "shippingCity" text NOT NULL,
    "shippingDistrict" text DEFAULT ''::text NOT NULL,
    "shippingStreet" text NOT NULL,
    "shippingZipCode" text DEFAULT ''::text NOT NULL,
    "guestName" text,
    "guestPhone" text,
    "guestEmail" text,
    "bankTransferImage" text,
    "bankTransferNote" text,
    "bankTransferVerifiedAt" timestamp(3) without time zone,
    "pointsEarned" integer DEFAULT 0 NOT NULL,
    "pointsUsed" integer DEFAULT 0 NOT NULL,
    "cancelComment" text,
    "cancelReason" text,
    "cancelledAt" timestamp(3) without time zone
);


ALTER TABLE public.orders OWNER TO eric;

--
-- Name: point_transactions; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.point_transactions (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."PointTransactionType" NOT NULL,
    amount integer NOT NULL,
    "orderId" text,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.point_transactions OWNER TO eric;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.product_variants (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    barcode text,
    attributes jsonb NOT NULL,
    color text,
    "colorHex" text,
    "colorImage" text,
    material text,
    pattern text,
    "priceAdjustment" numeric(10,2) DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "reservedStock" integer DEFAULT 0 NOT NULL,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    weight numeric(8,2),
    "isActive" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "soldCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_variants OWNER TO eric;

--
-- Name: products; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "originalPrice" numeric(10,2),
    cost numeric(10,2),
    stock integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    sku text NOT NULL,
    weight numeric(8,2),
    "categoryId" text NOT NULL,
    "brandId" text,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "soldCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "averageRating" numeric(3,2),
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "favoriteCount" integer DEFAULT 0 NOT NULL,
    "shoeType" text,
    gender public."ProductGender",
    season text,
    "heelHeight" numeric(5,2),
    closure text,
    sole text,
    features jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.products OWNER TO eric;

--
-- Name: return_items; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.return_items (
    id text NOT NULL,
    "returnId" text NOT NULL,
    "orderItemId" text NOT NULL,
    quantity integer NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.return_items OWNER TO eric;

--
-- Name: returns; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.returns (
    id text NOT NULL,
    "returnNumber" text NOT NULL,
    "orderId" text NOT NULL,
    type public."ReturnType" DEFAULT 'RETURN'::public."ReturnType" NOT NULL,
    reason public."ReturnReason" DEFAULT 'DEFECTIVE'::public."ReturnReason" NOT NULL,
    description text,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    "refundAmount" numeric(10,2) NOT NULL,
    "refundMethod" text,
    "refundStatus" public."RefundStatus" DEFAULT 'PENDING'::public."RefundStatus" NOT NULL,
    "refundedAt" timestamp(3) without time zone,
    "returnShippingFee" numeric(10,2) DEFAULT 0 NOT NULL,
    "trackingNumber" text,
    status public."ReturnStatus" DEFAULT 'REQUESTED'::public."ReturnStatus" NOT NULL,
    "processedBy" text,
    "processedAt" timestamp(3) without time zone,
    "adminNotes" text,
    "isSizeIssue" boolean DEFAULT false NOT NULL,
    "requestedSize" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.returns OWNER TO eric;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    rating integer NOT NULL,
    title text,
    content text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    "orderId" text,
    verified boolean DEFAULT false NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "helpfulCount" integer DEFAULT 0 NOT NULL,
    "sizeFit" public."SizeFit",
    "boughtSize" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reviews OWNER TO eric;

--
-- Name: size_charts; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.size_charts (
    id text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    eu text NOT NULL,
    us text NOT NULL,
    uk text NOT NULL,
    cm text NOT NULL,
    "footLength" numeric(5,2) NOT NULL,
    "footWidth" text,
    stock integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.size_charts OWNER TO eric;

--
-- Name: user_coupons; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.user_coupons (
    id text NOT NULL,
    "userId" text NOT NULL,
    "couponId" text NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "orderId" text,
    "obtainedFrom" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.user_coupons OWNER TO eric;

--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.user_credits (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    balance numeric(10,2) NOT NULL,
    source public."CreditSource" DEFAULT 'CAMPAIGN'::public."CreditSource" NOT NULL,
    "sourceId" text,
    "maxUsagePerOrder" numeric(10,2),
    "minOrderAmount" numeric(10,2),
    "validFrom" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_credits OWNER TO eric;

--
-- Name: users; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    phone text,
    password text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    avatar text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    birthday timestamp(3) without time zone,
    "emailVerifiedAt" timestamp(3) without time zone,
    "firstName" text,
    gender public."Gender",
    "isActive" boolean DEFAULT true NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "isPhoneVerified" boolean DEFAULT false NOT NULL,
    "lastName" text,
    "membershipExpiredAt" timestamp(3) without time zone,
    "membershipPoints" integer DEFAULT 0 NOT NULL,
    "membershipTier" public."MembershipTier" DEFAULT 'BRONZE'::public."MembershipTier" NOT NULL,
    "phoneVerifiedAt" timestamp(3) without time zone,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "totalSpent" numeric(12,2) DEFAULT 0 NOT NULL,
    "isFirstTimeBuyer" boolean DEFAULT true NOT NULL,
    "firstPurchaseAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO eric;

--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: eric
--

CREATE TABLE public.wishlist_items (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wishlist_items OWNER TO eric;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0ec6cf3f-f295-4e45-a99d-f6a1919f5e07	a66f0a15f52e7fae6e72d1e050f4fe3ce743a9ad4931f313acdb8835ee1a685e	2025-10-27 15:20:30.229403+08	20251019175642_init	\N	\N	2025-10-27 15:20:30.173066+08	1
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.addresses (id, "userId", name, phone, country, city, district, street, "zipCode", "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.brands (id, name, slug, description, logo, website, country, "isActive", "isFeatured", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmh8tgfmy000412jbag83qkwb	Nike	nike	全球運動品牌領導者，Just Do It	/images/brands/nike.png	https://www.nike.com	美國	t	t	1	2025-10-27 07:28:34.858	2025-10-27 07:28:34.858
cmh8tgfmy000612jbzw11yz6f	Adidas	adidas	德國運動品牌，三條線經典設計	/images/brands/adidas.png	https://www.adidas.com	德國	t	t	2	2025-10-27 07:28:34.858	2025-10-27 07:28:34.858
cmh8tgfmy000512jbcfhkrg5t	New Balance	new-balance	美國運動品牌，強調舒適與性能	/images/brands/new-balance.png	https://www.newbalance.com	美國	t	t	3	2025-10-27 07:28:34.858	2025-10-27 07:28:34.858
cmh8tgfn2000712jbctx2b45l	Vans	vans	滑板鞋經典品牌，街頭文化代表	/images/brands/vans.png	https://www.vans.com	美國	t	f	6	2025-10-27 07:28:34.858	2025-10-27 07:28:34.858
cmh8tgfn3000812jbxml01w0q	Converse	converse	經典帆布鞋品牌，Chuck Taylor All Star	/images/brands/converse.png	https://www.converse.com	美國	t	f	4	2025-10-27 07:28:34.858	2025-10-27 07:28:34.858
cmh8tgfn4000912jbf01bqsz9	Puma	puma	德國運動品牌，美洲豹標誌	/images/brands/puma.png	https://www.puma.com	德國	t	f	5	2025-10-27 07:28:34.858	2025-10-27 07:28:34.858
\.


--
-- Data for Name: campaign_orders; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.campaign_orders (id, "campaignId", "orderId", "userId", "discountAmount", "discountType", "originalPrice", "finalPrice", "appliedRules", "appliedAt") FROM stdin;
\.


--
-- Data for Name: campaign_participations; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.campaign_participations (id, "campaignId", "userId", status, "rewardsEarned", "rewardsStatus", "participatedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: campaign_rewards; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.campaign_rewards (id, "campaignId", "userId", "rewardType", "rewardValue", "couponId", "productId", status, "earnedAt", "grantedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.campaigns (id, name, slug, description, type, rules, conditions, "discountRules", "startDate", "endDate", "maxParticipants", "maxUsagePerUser", "maxDiscountAmount", "minOrderAmount", status, priority, "isActive", "isPublic", "bannerImage", "thumbnailImage", "participantCount", "completedCount", "totalRevenue", "totalDiscount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.cart_items (id, "userId", "productId", quantity, "createdAt", "updatedAt", "addedPrice", "variantId", "sizeEu") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.categories (id, name, slug, description, image, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmh8tgfn6000a12jbpf39wpqs	運動鞋	sports-shoes	專業運動鞋款，適合跑步、籃球、訓練等	/images/categories/sports.jpg	1	t	2025-10-27 07:28:34.866	2025-10-27 07:28:34.866
cmh8tgfn6000e12jb8jmzi9tn	靴子	boots	秋冬必備，保暖時尚	/images/categories/boots.jpg	5	t	2025-10-27 07:28:34.866	2025-10-27 07:28:34.866
cmh8tgfn6000b12jbi7fl83em	帆布鞋	canvas-shoes	經典帆布材質，街頭風格	/images/categories/canvas.jpg	3	t	2025-10-27 07:28:34.866	2025-10-27 07:28:34.866
cmh8tgfn6000c12jb2wszyjc1	休閒鞋	casual-shoes	日常休閒穿搭，舒適百搭	/images/categories/casual.jpg	2	t	2025-10-27 07:28:34.866	2025-10-27 07:28:34.866
cmh8tgfn6000d12jbqt05t8wa	皮鞋	leather-shoes	正式場合首選，優雅品味	/images/categories/leather.jpg	4	t	2025-10-27 07:28:34.866	2025-10-27 07:28:34.866
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.coupons (id, code, name, description, type, value, "minAmount", "maxDiscount", "usageLimit", "usedCount", "userLimit", "isActive", "createdAt", "updatedAt", "applicableCategories", "applicableProducts", "excludeProducts", "isPublic", "validFrom", "validUntil") FROM stdin;
cmh8tgfo3003812jba4jjboew	FREESHIP	免運費	消費滿 1500 元免運費	FREE_SHIPPING	0.00	1500.00	\N	\N	0	\N	t	2025-10-27 07:28:34.899	2025-10-27 07:28:34.899	[]	[]	[]	t	2025-10-27 07:28:34.899	2025-12-31 00:00:00
cmh8tgfo3003712jbkcrghy8g	SALE20	全館 8 折	全館商品享 8 折優惠	PERCENTAGE	20.00	2000.00	1000.00	500	0	\N	t	2025-10-27 07:28:34.899	2025-10-27 07:28:34.899	[]	[]	[]	t	2025-10-27 07:28:34.899	2025-11-30 00:00:00
cmh8tgfo3003912jbf0wrzsap	WELCOME100	新會員優惠	新會員註冊即享 100 元折扣	FIXED	100.00	1000.00	\N	1000	0	\N	t	2025-10-27 07:28:34.899	2025-10-27 07:28:34.899	[]	[]	[]	t	2025-10-27 07:28:34.899	2025-12-31 00:00:00
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.faqs (id, question, answer, category, slug, "viewCount", "helpfulCount", "isPublished", priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.notifications (id, "userId", type, title, message, data, "isRead", "isArchived", "relatedId", "actionUrl", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.order_items (id, "orderId", "productId", "productName", "productImage", price, quantity, subtotal, "createdAt", sku, "variantAttrs", "variantId", "variantName", "sizeEu", color) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.orders (id, "orderNumber", "userId", "addressId", subtotal, "shippingFee", discount, total, status, "paymentStatus", "shippingStatus", "paymentMethod", "paymentId", "paidAt", "shippingMethod", "trackingNumber", "shippedAt", "deliveredAt", "couponId", notes, "createdAt", "updatedAt", "shippingName", "shippingPhone", "shippingCountry", "shippingCity", "shippingDistrict", "shippingStreet", "shippingZipCode", "guestName", "guestPhone", "guestEmail", "bankTransferImage", "bankTransferNote", "bankTransferVerifiedAt", "pointsEarned", "pointsUsed", "cancelComment", "cancelReason", "cancelledAt") FROM stdin;
\.


--
-- Data for Name: point_transactions; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.point_transactions (id, "userId", type, amount, "orderId", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.product_variants (id, "productId", name, sku, barcode, attributes, color, "colorHex", "colorImage", material, pattern, "priceAdjustment", stock, "reservedStock", images, weight, "isActive", "isDefault", "sortOrder", "soldCount", "createdAt", "updatedAt") FROM stdin;
cmh8tgfnb000k12jbbhbqrcuh	cmh8tgfn8000g12jbqhky4itd	Air Max 270 - 黑白	NIKE-AM270-001-BW	\N	"{\\"color\\":\\"黑白\\"}"	黑白	#000000	/images/products/nike-air-max-270-black-white.jpg	合成革+網布	純色	0.00	50	0	[]	\N	t	t	1	0	2025-10-27 07:28:34.871	2025-10-27 07:28:34.871
cmh8tgfnb000l12jbdo54gv6w	cmh8tgfn8000g12jbqhky4itd	Air Max 270 - 紅黑	NIKE-AM270-001-RB	\N	"{\\"color\\":\\"紅黑\\"}"	紅黑	#CC0000	/images/products/nike-air-max-270-red-black.jpg	合成革+網布	純色	200.00	50	0	[]	\N	t	f	3	0	2025-10-27 07:28:34.871	2025-10-27 07:28:34.871
cmh8tgfnb000m12jbiec09lvm	cmh8tgfn8000g12jbqhky4itd	Air Max 270 - 藍白	NIKE-AM270-001-BLW	\N	"{\\"color\\":\\"藍白\\"}"	藍白	#0066CC	/images/products/nike-air-max-270-blue-white.jpg	合成革+網布	純色	0.00	50	0	[]	\N	t	f	2	0	2025-10-27 07:28:34.871	2025-10-27 07:28:34.871
cmh8tgfnp001k12jb4w7pawh8	cmh8tgfno001g12jbrmyz80of	NB 574 - 灰色	NB-574-001-GY	\N	"{\\"color\\":\\"灰色\\"}"	灰色	#808080	\N	麂皮+網布	純色	0.00	70	0	[]	\N	t	t	1	0	2025-10-27 07:28:34.885	2025-10-27 07:28:34.885
cmh8tgfnp001l12jbtvpg9oh6	cmh8tgfno001g12jbrmyz80of	NB 574 - 海軍藍	NB-574-001-NB	\N	"{\\"color\\":\\"海軍藍\\"}"	海軍藍	#000080	\N	麂皮+網布	純色	0.00	65	0	[]	\N	t	f	2	0	2025-10-27 07:28:34.885	2025-10-27 07:28:34.885
cmh8tgfnp001m12jbc58gaiss	cmh8tgfno001g12jbrmyz80of	NB 574 - 酒紅色	NB-574-001-WR	\N	"{\\"color\\":\\"酒紅色\\"}"	酒紅色	#722F37	\N	麂皮+網布	純色	0.00	65	0	[]	\N	t	f	3	0	2025-10-27 07:28:34.885	2025-10-27 07:28:34.885
cmh8tgfny002712jbyou6ai3k	cmh8tgfnw002412jbghshw8yb	Chuck Taylor - 紅色	CONV-CT-001-RD	\N	"{\\"color\\":\\"紅色\\"}"	紅色	#FF0000	\N	帆布	純色	0.00	100	0	[]	\N	t	f	3	0	2025-10-27 07:28:34.895	2025-10-27 07:28:34.895
cmh8tgfny002a12jbn1s6g1fq	cmh8tgfnw002412jbghshw8yb	Chuck Taylor - 白色	CONV-CT-001-WH	\N	"{\\"color\\":\\"白色\\"}"	白色	#FFFFFF	\N	帆布	純色	0.00	100	0	[]	\N	t	f	2	0	2025-10-27 07:28:34.895	2025-10-27 07:28:34.895
cmh8tgfny002912jb9yer2uu0	cmh8tgfnw002412jbghshw8yb	Chuck Taylor - 黑色	CONV-CT-001-BK	\N	"{\\"color\\":\\"黑色\\"}"	黑色	#000000	\N	帆布	純色	0.00	100	0	[]	\N	t	t	1	0	2025-10-27 07:28:34.895	2025-10-27 07:28:34.895
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.products (id, name, slug, description, price, "originalPrice", cost, stock, "minStock", sku, weight, "categoryId", "brandId", images, "isActive", "isFeatured", "sortOrder", "viewCount", "soldCount", "createdAt", "updatedAt", "averageRating", "reviewCount", "favoriteCount", "shoeType", gender, season, "heelHeight", closure, sole, features) FROM stdin;
cmh8tgfn8000g12jbqhky4itd	Nike Air Max 270	nike-air-max-270	Nike Air Max 270 以超大氣墊設計，提供全天候舒適體驗。現代感外型搭配經典配色，是都市街頭穿搭的絕佳選擇。	4500.00	5500.00	2500.00	150	10	NIKE-AM270-001	0.80	cmh8tgfn6000a12jbpf39wpqs	cmh8tgfmy000412jbag83qkwb	"[\\"/images/products/nike-air-max-270-1.jpg\\",\\"/images/products/nike-air-max-270-2.jpg\\",\\"/images/products/nike-air-max-270-3.jpg\\"]"	t	t	1	1250	89	2025-10-27 07:28:34.869	2025-10-27 07:28:34.869	4.50	23	45	運動鞋	UNISEX	四季	3.20	系帶	EVA	"[\\"氣墊\\",\\"透氣\\",\\"輕量\\"]"
cmh8tgfnk001212jbz1a4gzob	Adidas Ultraboost 22	adidas-ultraboost-22	Adidas Ultraboost 22 搭載最新 Boost 科技，提供絕佳能量回饋。針織鞋面透氣舒適，是跑步愛好者的首選。	5200.00	6200.00	3000.00	120	10	ADIDAS-UB22-001	0.75	cmh8tgfn6000a12jbpf39wpqs	cmh8tgfmy000612jbzw11yz6f	"[\\"/images/products/adidas-ultraboost-22-1.jpg\\",\\"/images/products/adidas-ultraboost-22-2.jpg\\"]"	t	t	2	980	67	2025-10-27 07:28:34.881	2025-10-27 07:28:34.881	4.70	18	38	跑鞋	MEN	四季	2.80	系帶	Boost	"[\\"能量回饋\\",\\"透氣\\",\\"抓地力強\\"]"
cmh8tgfno001g12jbrmyz80of	New Balance 574	new-balance-574	New Balance 574 經典復古設計，麂皮與網布拼接，舒適耐穿。百搭外型適合各種場合。	3200.00	3800.00	1800.00	200	15	NB-574-001	0.70	cmh8tgfn6000c12jb2wszyjc1	cmh8tgfmy000512jbcfhkrg5t	"[\\"/images/products/new-balance-574-1.jpg\\",\\"/images/products/new-balance-574-2.jpg\\",\\"/images/products/new-balance-574-3.jpg\\"]"	t	t	3	1540	123	2025-10-27 07:28:34.884	2025-10-27 07:28:34.884	4.60	34	67	休閒鞋	UNISEX	四季	2.50	系帶	橡膠	"[\\"復古\\",\\"舒適\\",\\"耐穿\\"]"
cmh8tgfnw002412jbghshw8yb	Converse Chuck Taylor All Star	converse-chuck-taylor-all-star	經典帆布鞋，永不退流行的街頭時尚單品。高筒設計，百搭各種風格。	2100.00	2500.00	1000.00	300	20	CONV-CT-001	0.60	cmh8tgfn6000b12jbi7fl83em	cmh8tgfn3000812jbxml01w0q	"[\\"/images/products/converse-chuck-taylor-1.jpg\\",\\"/images/products/converse-chuck-taylor-2.jpg\\"]"	t	t	4	2100	189	2025-10-27 07:28:34.893	2025-10-27 07:28:34.893	4.80	56	95	帆布鞋	UNISEX	春夏	2.00	系帶	橡膠	"[\\"經典\\",\\"百搭\\",\\"透氣\\"]"
cmh8tgfo1002s12jb3rg2lu9d	Vans Old Skool	vans-old-skool	Vans 經典款式，側邊標誌性條紋設計。滑板鞋始祖，街頭潮流必備。	2400.00	2800.00	1200.00	180	15	VANS-OS-001	0.65	cmh8tgfn6000c12jb2wszyjc1	cmh8tgfn2000712jbctx2b45l	"[\\"/images/products/vans-old-skool-1.jpg\\",\\"/images/products/vans-old-skool-2.jpg\\",\\"/images/products/vans-old-skool-3.jpg\\"]"	t	f	5	1320	98	2025-10-27 07:28:34.897	2025-10-27 07:28:34.897	4.50	28	52	滑板鞋	UNISEX	四季	2.20	系帶	橡膠	"[\\"經典\\",\\"耐磨\\",\\"防滑\\"]"
\.


--
-- Data for Name: return_items; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.return_items (id, "returnId", "orderItemId", quantity, reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.returns (id, "returnNumber", "orderId", type, reason, description, images, "refundAmount", "refundMethod", "refundStatus", "refundedAt", "returnShippingFee", "trackingNumber", status, "processedBy", "processedAt", "adminNotes", "isSizeIssue", "requestedSize", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.reviews (id, "userId", "productId", rating, title, content, images, "orderId", verified, "isApproved", "isPublic", "helpfulCount", "sizeFit", "boughtSize", "createdAt", "updatedAt") FROM stdin;
cmh8tgfoe003t12jbuyb57x0s	cmh8tgfmr000112jb8h1dr566	cmh8tgfn8000g12jbqhky4itd	5	非常舒適！	Nike Air Max 270 穿起來非常舒適，氣墊效果很好，推薦購買！	[]	\N	t	t	t	0	TRUE_TO_SIZE	42	2025-10-27 07:28:34.911	2025-10-27 07:28:34.911
cmh8tgfoe003v12jb3zn8320i	cmh8tgfmr000112jb8h1dr566	cmh8tgfno001g12jbrmyz80of	5	經典款式	New Balance 574 真的很經典，穿搭百搭，品質也很好！	[]	\N	t	t	t	0	TRUE_TO_SIZE	41	2025-10-27 07:28:34.911	2025-10-27 07:28:34.911
cmh8tgfoe003u12jbd6ntlgdc	cmh8tgfmv000312jb5ucnpoj1	cmh8tgfn8000g12jbqhky4itd	4	外觀好看	顏色很漂亮，但尺碼偏大一點點，建議選小半號。	[]	\N	t	t	t	0	SLIGHTLY_LARGE	40	2025-10-27 07:28:34.911	2025-10-27 07:28:34.911
\.


--
-- Data for Name: size_charts; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.size_charts (id, "productId", "variantId", eu, us, uk, cm, "footLength", "footWidth", stock, "isActive", "createdAt", "updatedAt") FROM stdin;
cmh8tgfnd000q12jbiyx22wjs	cmh8tgfn8000g12jbqhky4itd	\N	42	8.5	7.5	26	26.00	標準	30	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfnd000p12jb5db5y740	cmh8tgfn8000g12jbqhky4itd	\N	39	7	6	24.5	24.50	標準	15	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfnd000v12jbegve7go1	cmh8tgfn8000g12jbqhky4itd	\N	40	7.5	6.5	25	25.00	標準	20	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfnd000w12jbn0zqnv4x	cmh8tgfn8000g12jbqhky4itd	\N	43	9.5	8.5	27	27.00	標準	30	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfnd000y12jb43glrrc0	cmh8tgfn8000g12jbqhky4itd	\N	45	11	10	28.5	28.50	標準	10	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfnd000x12jb5t76wrrp	cmh8tgfn8000g12jbqhky4itd	\N	44	10	9	27.5	27.50	標準	20	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfni001012jbrwm7p7gy	cmh8tgfn8000g12jbqhky4itd	\N	41	8	7	25.5	25.50	標準	25	t	2025-10-27 07:28:34.874	2025-10-27 07:28:34.874
cmh8tgfnn001412jbil8cin5f	cmh8tgfnk001212jbz1a4gzob	\N	40	7.5	6.5	25	25.00	標準	15	t	2025-10-27 07:28:34.883	2025-10-27 07:28:34.883
cmh8tgfnn001912jbs5t2i5z5	cmh8tgfnk001212jbz1a4gzob	\N	42	8.5	7.5	26	26.00	標準	25	t	2025-10-27 07:28:34.883	2025-10-27 07:28:34.883
cmh8tgfnn001a12jbnv1ck5lb	cmh8tgfnk001212jbz1a4gzob	\N	41	8	7	25.5	25.50	標準	20	t	2025-10-27 07:28:34.883	2025-10-27 07:28:34.883
cmh8tgfnn001b12jb9j9s66cm	cmh8tgfnk001212jbz1a4gzob	\N	44	10	9	27.5	27.50	標準	20	t	2025-10-27 07:28:34.883	2025-10-27 07:28:34.883
cmh8tgfnn001c12jbsscu8c5i	cmh8tgfnk001212jbz1a4gzob	\N	43	9.5	8.5	27	27.00	標準	30	t	2025-10-27 07:28:34.883	2025-10-27 07:28:34.883
cmh8tgfnn001e12jb0m4uck48	cmh8tgfnk001212jbz1a4gzob	\N	45	11	10	28.5	28.50	標準	10	t	2025-10-27 07:28:34.884	2025-10-27 07:28:34.884
cmh8tgfnq001o12jbbzp4pg6y	cmh8tgfno001g12jbrmyz80of	\N	38	6.5	5.5	24	24.00	標準	20	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnq001t12jb6lsgkfmb	cmh8tgfno001g12jbrmyz80of	\N	39	7	6	24.5	24.50	標準	25	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnq001u12jbll8hfpm7	cmh8tgfno001g12jbrmyz80of	\N	40	7.5	6.5	25	25.00	標準	30	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnq001v12jbqmsuyjr1	cmh8tgfno001g12jbrmyz80of	\N	41	8	7	25.5	25.50	標準	35	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnq001w12jbcaph8wn3	cmh8tgfno001g12jbrmyz80of	\N	42	8.5	7.5	26	26.00	標準	40	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnq001y12jbyikbjimy	cmh8tgfno001g12jbrmyz80of	\N	44	10	9	27.5	27.50	標準	15	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnq002012jbo4ez8k3d	cmh8tgfno001g12jbrmyz80of	\N	45	11	10	28.5	28.50	標準	5	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnu002212jb2klj2oc6	cmh8tgfno001g12jbrmyz80of	\N	43	9.5	8.5	27	27.00	標準	30	t	2025-10-27 07:28:34.887	2025-10-27 07:28:34.887
cmh8tgfnz002d12jbgb08ob88	cmh8tgfnw002412jbghshw8yb	\N	36	5	3.5	22.5	22.50	標準	30	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfnz002e12jbmci9ebw0	cmh8tgfnw002412jbghshw8yb	\N	37	5.5	4.5	23	23.00	標準	40	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo0002j12jblxw1klwn	cmh8tgfnw002412jbghshw8yb	\N	38	6.5	5.5	24	24.00	標準	50	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo0002k12jbs5z2k7o0	cmh8tgfnw002412jbghshw8yb	\N	39	7	6	24.5	24.50	標準	60	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo0002l12jbal5hukba	cmh8tgfnw002412jbghshw8yb	\N	41	8	7	25.5	25.50	標準	40	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo0002m12jbu80tlk5r	cmh8tgfnw002412jbghshw8yb	\N	40	7.5	6.5	25	25.00	標準	50	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo0002p12jbb22gs4m5	cmh8tgfnw002412jbghshw8yb	\N	43	9.5	8.5	27	27.00	標準	10	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo0002q12jbc74nv3k8	cmh8tgfnw002412jbghshw8yb	\N	42	8.5	7.5	26	26.00	標準	20	t	2025-10-27 07:28:34.896	2025-10-27 07:28:34.896
cmh8tgfo2003112jbax2gknhv	cmh8tgfo1002s12jb3rg2lu9d	\N	42	8.5	7.5	26	26.00	標準	30	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
cmh8tgfo2003212jbub3kf9rq	cmh8tgfo1002s12jb3rg2lu9d	\N	41	8	7	25.5	25.50	標準	35	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
cmh8tgfo2002y12jbcgttfp5w	cmh8tgfo1002s12jb3rg2lu9d	\N	38	6.5	5.5	24	24.00	標準	20	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
cmh8tgfo2003012jb5vhbam5x	cmh8tgfo1002s12jb3rg2lu9d	\N	40	7.5	6.5	25	25.00	標準	35	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
cmh8tgfo2002x12jbpxg3hhda	cmh8tgfo1002s12jb3rg2lu9d	\N	39	7	6	24.5	24.50	標準	30	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
cmh8tgfo2003512jbzkw268oq	cmh8tgfo1002s12jb3rg2lu9d	\N	43	9.5	8.5	27	27.00	標準	20	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
cmh8tgfo2003612jb4v7vm10w	cmh8tgfo1002s12jb3rg2lu9d	\N	44	10	9	27.5	27.50	標準	10	t	2025-10-27 07:28:34.898	2025-10-27 07:28:34.898
\.


--
-- Data for Name: user_coupons; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.user_coupons (id, "userId", "couponId", "isUsed", "usedAt", "orderId", "obtainedFrom", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.user_credits (id, "userId", amount, balance, source, "sourceId", "maxUsagePerOrder", "minOrderAmount", "validFrom", "validUntil", "isActive", "isUsed", "createdAt", "updatedAt") FROM stdin;
cmh8tgfob003m12jbobxjrunj	cmh8tgfmv000312jb5ucnpoj1	200.00	200.00	CAMPAIGN	\N	\N	\N	2025-10-27 07:28:34.907	2025-11-30 00:00:00	t	f	2025-10-27 07:28:34.907	2025-10-27 07:28:34.907
cmh8tgfob003l12jbld5fmy2r	cmh8tgfmr000112jb8h1dr566	500.00	500.00	ADMIN_GRANT	\N	\N	\N	2025-10-27 07:28:34.907	2025-12-31 00:00:00	t	f	2025-10-27 07:28:34.907	2025-10-27 07:28:34.907
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.users (id, email, phone, password, name, role, avatar, "createdAt", "updatedAt", "lastLogin", birthday, "emailVerifiedAt", "firstName", gender, "isActive", "isEmailVerified", "isPhoneVerified", "lastName", "membershipExpiredAt", "membershipPoints", "membershipTier", "phoneVerifiedAt", preferences, "totalOrders", "totalSpent", "isFirstTimeBuyer", "firstPurchaseAt") FROM stdin;
cmh8tgfmf000012jbzysnhgxb	admin@shoe.com	0912345678	$2a$12$0pZRVv8oEz2QSaiiwCIkYO5.7bLCnQs.vRAzGh1Y3HRmgJu1geNrW	系統管理員	ADMIN	\N	2025-10-27 07:28:34.839	2025-10-27 07:28:34.839	\N	\N	\N	\N	\N	t	t	t	\N	\N	10000	DIAMOND	\N	{}	15	250000.00	f	2024-01-15 00:00:00
cmh8tgfmr000112jb8h1dr566	user1@example.com	0923456789	$2a$12$0pZRVv8oEz2QSaiiwCIkYO5.7bLCnQs.vRAzGh1Y3HRmgJu1geNrW	張小明	USER	\N	2025-10-27 07:28:34.852	2025-10-27 07:28:34.852	\N	\N	\N	\N	\N	t	f	f	\N	\N	3500	GOLD	\N	{}	8	65000.00	f	2024-03-10 00:00:00
cmh8tgfmv000212jbn9io0hl4	user3@example.com	0945678901	$2a$12$0pZRVv8oEz2QSaiiwCIkYO5.7bLCnQs.vRAzGh1Y3HRmgJu1geNrW	王大明	USER	\N	2025-10-27 07:28:34.852	2025-10-27 07:28:34.852	\N	\N	\N	\N	\N	t	f	f	\N	\N	500	BRONZE	\N	{}	1	5000.00	f	2024-09-01 00:00:00
cmh8tgfmv000312jb5ucnpoj1	user2@example.com	0934567890	$2a$12$0pZRVv8oEz2QSaiiwCIkYO5.7bLCnQs.vRAzGh1Y3HRmgJu1geNrW	李小華	USER	\N	2025-10-27 07:28:34.852	2025-10-27 07:28:34.852	\N	\N	\N	\N	\N	t	f	f	\N	\N	1200	SILVER	\N	{}	3	25000.00	f	2024-06-20 00:00:00
\.


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: eric
--

COPY public.wishlist_items (id, "userId", "productId", "createdAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: campaign_orders campaign_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_orders
    ADD CONSTRAINT campaign_orders_pkey PRIMARY KEY (id);


--
-- Name: campaign_participations campaign_participations_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_participations
    ADD CONSTRAINT campaign_participations_pkey PRIMARY KEY (id);


--
-- Name: campaign_rewards campaign_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_rewards
    ADD CONSTRAINT campaign_rewards_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: point_transactions point_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: size_charts size_charts_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.size_charts
    ADD CONSTRAINT size_charts_pkey PRIMARY KEY (id);


--
-- Name: user_coupons user_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT user_coupons_pkey PRIMARY KEY (id);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: brands_name_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX brands_name_key ON public.brands USING btree (name);


--
-- Name: brands_slug_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX brands_slug_key ON public.brands USING btree (slug);


--
-- Name: campaign_orders_campaignId_orderId_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "campaign_orders_campaignId_orderId_key" ON public.campaign_orders USING btree ("campaignId", "orderId");


--
-- Name: campaign_participations_campaignId_userId_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "campaign_participations_campaignId_userId_key" ON public.campaign_participations USING btree ("campaignId", "userId");


--
-- Name: campaigns_slug_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX campaigns_slug_key ON public.campaigns USING btree (slug);


--
-- Name: cart_items_userId_productId_variantId_sizeEu_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "cart_items_userId_productId_variantId_sizeEu_key" ON public.cart_items USING btree ("userId", "productId", "variantId", "sizeEu");


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: faqs_slug_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX faqs_slug_key ON public.faqs USING btree (slug);


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: product_variants_sku_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: returns_returnNumber_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "returns_returnNumber_key" ON public.returns USING btree ("returnNumber");


--
-- Name: reviews_userId_productId_orderId_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "reviews_userId_productId_orderId_key" ON public.reviews USING btree ("userId", "productId", "orderId");


--
-- Name: size_charts_productId_variantId_eu_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "size_charts_productId_variantId_eu_key" ON public.size_charts USING btree ("productId", "variantId", eu);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: wishlist_items_userId_productId_key; Type: INDEX; Schema: public; Owner: eric
--

CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON public.wishlist_items USING btree ("userId", "productId");


--
-- Name: addresses addresses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_orders campaign_orders_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_orders
    ADD CONSTRAINT "campaign_orders_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaign_orders campaign_orders_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_orders
    ADD CONSTRAINT "campaign_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaign_orders campaign_orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_orders
    ADD CONSTRAINT "campaign_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: campaign_participations campaign_participations_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_participations
    ADD CONSTRAINT "campaign_participations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_participations campaign_participations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_participations
    ADD CONSTRAINT "campaign_participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_rewards campaign_rewards_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_rewards
    ADD CONSTRAINT "campaign_rewards_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaign_rewards campaign_rewards_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_rewards
    ADD CONSTRAINT "campaign_rewards_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: campaign_rewards campaign_rewards_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.campaign_rewards
    ADD CONSTRAINT "campaign_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: point_transactions point_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT "point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: return_items return_items_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT "return_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public.order_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: return_items return_items_returnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES public.returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: returns returns_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT "returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: size_charts size_charts_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.size_charts
    ADD CONSTRAINT "size_charts_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_coupons user_coupons_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT "user_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_coupons user_coupons_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT "user_coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_credits user_credits_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT "user_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eric
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: eric
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

