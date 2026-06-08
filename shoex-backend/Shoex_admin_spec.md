# SHOEX — Backend API Requirements & Integration Specification

**Version:** 1.1 (Updated)
**Prepared by:** Frontend Architecture Review
**Project:** SHOEX E-Commerce Admin Dashboard
**Stack (Frontend):** React 18 + TypeScript + Zustand + React Router v6 + TailwindCSS
**Base URL (dev):** `http://localhost:5000/api`
**Base URL (prod):** `https://api.shoex.com/api`

---

## Table of Contents

1. [Project Overview & Global Context](#1-project-overview--global-context)
2. [Page-by-Page Breakdown & API Endpoints](#2-page-by-page-breakdown--api-endpoints)
3. [Critical Logic & Feature Specifications](#3-critical-logic--feature-specifications)
4. [Integration Best Practices & Handshake Tips](#4-integration-best-practices--handshake-tips)

---

## 1. Project Overview & Global Context

### Panel Structure

| Section | Purpose |
|---|---|
| Dashboard | KPI overview, recent orders, low-stock alerts, revenue charts |
| Products | Full CRUD, discount management, per-size inventory |
| Orders | Order lifecycle management, status workflow, WhatsApp contact |
| Order Detail | Single order view, timeline, invoice download, notes |
| Analytics | Revenue/orders/customers charts filtered by date range |
| Customers | Customer list, search, status management, CSV export |
| Inventory | Per-product stock view, movement tracking, stock adjustment |
| Shipping | Active shipments view, tracking numbers |
| Settings | Store info, payment gateways, Egypt shipping rates, team, notifications, security |

### Global Authentication

Every admin API request **must** include a JWT Bearer token:

```
Authorization: Bearer <token>
```

- Token stored in Zustand `authStore` → `token` field, persisted via `zustand/middleware persist` under key `"shoex-auth"`.
- On 401 response → frontend Axios interceptor calls `POST /api/v1/auth/refresh`.
- If refresh fails → `logout()` from `useAuthStore` + redirect to `/login`.
- Token payload must include: `id`, `email`, `role` (`"admin"` | `"owner"`), `name`, `isOwner`.

### Standard Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}

// Paginated Success
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 85,
    "totalPages": 9
  }
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE_ENUM"
}
```

### Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Valid token but insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Invalid request payload |
| `CONFLICT` | 409 | Duplicate (e.g. duplicate SKU) |
| `INVALID_STATUS_TRANSITION` | 400 | Invalid order status progression |
| `SERVER_ERROR` | 500 | Internal error |

---

## 2. Page-by-Page Breakdown & API Endpoints

---

### 2.1 Authentication

**File:** `src/store/authStore.ts`, `src/services/auth.service.ts`

#### POST `/api/v1/auth/login`

**Request Body:**
```json
{
  "email": "boodymns@gmail.com",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_001",
      "name": "Store Owner",
      "email": "boodymns@gmail.com",
      "role": "owner",
      "avatar": null,
      "phone": "01063638026"
    }
  }
}
```

**Frontend Variable Mapping:**
- `data.token` → `useAuthStore.token`
- `data.user` → `useAuthStore.user`
- `data.user.role` → used in `AdminSettings` to gate Team section

---

#### POST `/api/v1/auth/logout`

**Request Body:** none (token from header)

**Success Response:**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

#### GET `/api/v1/auth/me` *(NEW)*

**Purpose:** Verify token and refresh user data on page reload. Called once on app mount.

**Headers:** `Authorization: Bearer <token>`

**Success Response:** Same `user` object as login response.

**Error Response `401`:** Frontend calls `logout()` and redirects to `/login`.

---

#### POST `/api/v1/auth/refresh` *(NEW)*

**Purpose:** Exchange a refresh token for a new access token. Called automatically by Axios interceptor on 401 responses.

**Request Body:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**Error Response `401`:** Refresh token expired — frontend calls `logout()` and redirects to `/login`.

---

#### POST `/api/v1/auth/forgot-password` *(NEW)*

**Purpose:** Send a password reset email. Used on the Login page "Forgot Password" link.

**Request Body:** `{ "email": "admin@shoex.com" }`

**Success Response `200`:**
```json
{ "success": true, "message": "Password reset email sent if account exists." }
```

> Always return 200 even if email doesn't exist — never confirm account existence.

---

#### POST `/api/v1/auth/reset-password` *(NEW)*

**Purpose:** Set new password using reset token from email link.

**Request Body:**
```json
{
  "resetToken": "abc123...",
  "newPassword": "newSecurePass456"
}
```

**Success Response `200`:** `{ "success": true, "message": "Password updated. Please log in." }`

**Error Response `400`:** Token expired or invalid.

---

### 2.2 Admin Dashboard

**File:** `src/pages/admin/AdminDashboard.tsx`

**Core Frontend Features:**
- 4 KPI stat cards (today's revenue, orders today, pending orders, avg order value)
- Revenue line chart (last 7 days)
- Orders bar chart (last 7 days)
- Recent orders list (today's orders, fallback to latest 5)
- Low stock alerts (products with stock < 10)
- 3 progress cards (weekly revenue, new customers, products sold)

---

#### GET `/api/v1/admin/dashboard/stats`

**Success Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "revenue": 1240.50,
      "orders": 8,
      "avgOrderValue": 155.06,
      "newCustomers": 3
    },
    "week": {
      "revenue": 8750.00,
      "orders": 54,
      "avgOrderValue": 162.03,
      "newCustomers": 24
    },
    "month": {
      "revenue": 32400.00,
      "orders": 210,
      "avgOrderValue": 154.28,
      "newCustomers": 87
    },
    "revenueChart": [
      { "date": "Mon", "revenue": 1200, "orders": 7 },
      { "date": "Tue", "revenue": 980,  "orders": 5 },
      { "date": "Wed", "revenue": 1540, "orders": 10 },
      { "date": "Thu", "revenue": 870,  "orders": 6 },
      { "date": "Fri", "revenue": 2100, "orders": 13 },
      { "date": "Sat", "revenue": 1760, "orders": 9 },
      { "date": "Sun", "revenue": 300,  "orders": 4 }
    ],
    "weeklyRevenueTarget": 50000,
    "monthlyCustomersTarget": 40,
    "monthlyProductsSoldTarget": 200,
    "productsSoldThisMonth": 156
  }
}
```

**Frontend Variable Mapping:**
- `data.today` → StatCards
- `data.revenueChart` → LineChart + BarChart
- `data.week.revenue` + `weeklyRevenueTarget` → weekly progress bar

---

#### GET `/api/v1/admin/dashboard/recent-orders`

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2026-001",
      "customerName": "Ahmed Mohamed",
      "customerPhone": "01012345678",
      "total": 340.00,
      "orderStatus": "New Order",
      "date": "2026-06-07T10:23:00Z"
    }
  ]
}
```

---

#### GET `/api/v1/admin/dashboard/low-stock`

**Query Params:** `?threshold=10` (default 10)

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_001",
      "name": "Air Force Classic White",
      "category": "Lifestyle",
      "images": ["https://..."],
      "stock": 3
    }
  ]
}
```

---

### 2.3 Admin Products

**File:** `src/pages/admin/AdminProducts.tsx`, `AddProduct.tsx`, `EditProduct.tsx`

---

#### GET `/api/v1/admin/products`

**Query Params:**
```
?search=air force&category=Lifestyle
&sortBy=name&sortDir=asc
&page=1&limit=10
```

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_001",
      "name": "Air Force Classic White",
      "brand": "SHOEX",
      "category": "Lifestyle",
      "price": 120.00,
      "originalPrice": 150.00,
      "images": ["https://cdn.shoex.com/af1-white.jpg"],
      "backgroundImageIndex": 0,
      "sku": "LIF-AIRF-1234",
      "stock": 24,
      "inStock": true,
      "sizeStocks": [
        { "size": 40, "stock": 5 },
        { "size": 41, "stock": 8 },
        { "size": 42, "stock": 11 }
      ],
      "sizes": [40, 41, 42],
      "colors": [
        { "name": "White", "hex": "#ffffff" },
        { "name": "Black", "hex": "#000000" }
      ],
      "tags": ["classic", "lifestyle"],
      "description": "Timeless classic design...",
      "rating": 4.5,
      "reviewCount": 128,
      "featured": true,
      "status": "Active",
      "weight": 0.8
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
}
```

---

#### POST `/api/v1/admin/products`

**Request Body:**
```json
{
  "name": "Air Force Classic White",
  "brand": "SHOEX",
  "category": "Lifestyle",
  "description": "Timeless classic design...",
  "tags": ["classic", "lifestyle"],
  "images": ["https://cdn.shoex.com/af1.jpg"],
  "backgroundImageIndex": 0,
  "price": 120.00,
  "originalPrice": 150.00,
  "stock": 24,
  "sizeStocks": [
    { "size": 40, "stock": 5 },
    { "size": 41, "stock": 8 },
    { "size": 42, "stock": 11 }
  ],
  "sizes": [40, 41, 42],
  "colors": [{ "name": "White", "hex": "#ffffff" }],
  "sku": "LIF-AIRF-1234",
  "featured": false,
  "status": "Active",
  "weight": 0.8
}
```

**Success Response:** Full product object with generated `id`, `rating: 0`, `reviewCount: 0`.

> **Status Handling:** Frontend passes `status` directly as `"Active"` or `"Draft"` — never rely on a separate state field.

---

#### PUT `/api/v1/admin/products/:id`

**Request Body:** Same as POST.
**Success Response:** Updated full product object.

---

#### DELETE `/api/v1/admin/products/:id`

**Success Response:**
```json
{ "success": true, "message": "Product deleted successfully" }
```

---

#### PATCH `/api/v1/admin/products/:id/discount`

**Request Body:** `{ "discountPercent": 20 }`

**Backend Logic:**
- `originalPrice = product.originalPrice ?? product.price` (preserve original if already discounted)
- `newPrice = originalPrice * (1 - discountPercent / 100)` rounded to 2 decimals

---

#### PATCH `/api/v1/admin/products/:id/discount/remove`

**Success Response:** Product with restored `price = originalPrice`, `originalPrice = null`.

---

#### PATCH `/api/v1/admin/products/:id/stock`

**Request Body:** `{ "stock": 50 }`
**Success Response:** Updated product with new `stock` and derived `inStock`.

---

#### POST `/api/v1/admin/products/upload-image`

**Request:** `multipart/form-data` with field `image` (File)

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.shoex.com/products/prod_001_img1.jpg",
    "key": "products/prod_001_img1.jpg"
  }
}
```

**Image Upload Flow:**
1. Frontend uploads blob URL files via this endpoint before submitting the product form
2. Backend stores on S3/Cloudinary, returns permanent CDN URL
3. Frontend replaces blob URLs with CDN URLs
4. CDN URLs included in final product payload

---

### 2.4 Admin Orders

**File:** `src/pages/admin/AdminOrders.tsx`

---

#### GET `/api/v1/admin/orders`

**Query Params:**
```
?search=ahmed&orderStatus=New Order&paymentStatus=Pending
&page=1&limit=50
```

**Sorting Rule:** New Orders always float to top, then by date descending.

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2026-001",
      "customerName": "Ahmed Mohamed",
      "customerEmail": "ahmed@example.com",
      "customerPhone": "01012345678",
      "products": [
        {
          "productId": "prod_001",
          "name": "Air Force Classic White",
          "image": "https://cdn.shoex.com/af1.jpg",
          "price": 120.00,
          "quantity": 2,
          "size": 42,
          "color": "White"
        }
      ],
      "total": 240.00,
      "orderStatus": "New Order",
      "paymentStatus": "Pending",
      "shippingStatus": "Pending",
      "shippingAddress": "123 Tahrir Square, Cairo, Egypt",
      "trackingNumber": null,
      "notes": null,
      "date": "2026-06-07T10:23:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 120, "totalPages": 3 }
}
```

---

#### PATCH `/api/v1/admin/orders/:id/status`

**Request Body:** `{ "orderStatus": "Confirmed" }`

**Allowed Values:** `"New Order"` | `"Contacted"` | `"Confirmed"` | `"Packed"` | `"Shipped"` | `"Out For Delivery"` | `"Delivered"` | `"Cancelled"` | `"Returned"`

**Backend Rule:** Enforce forward-only progression. Reject backward transitions.

**WhatsApp Auto-Advance:** When frontend opens WhatsApp for a "New Order", it fires `PATCH /orders/:id/status` with `{ orderStatus: "Contacted" }` immediately.

---

#### PATCH `/api/v1/admin/orders/:id/payment-status`
**Request Body:** `{ "paymentStatus": "Paid" }`
**Allowed Values:** `"Paid"` | `"Pending"` | `"Failed"` | `"Refunded"`

#### PATCH `/api/v1/admin/orders/:id/tracking`
**Request Body:** `{ "trackingNumber": "EGX123456789" }`

#### PATCH `/api/v1/admin/orders/:id/notes`
**Request Body:** `{ "notes": "Customer requested gift wrapping." }`

#### GET `/api/v1/admin/orders/export`
**Query Params:** Same filters as GET list.
**Response:** `Content-Type: text/csv` with `Content-Disposition: attachment; filename="orders-YYYY-MM-DD.csv"`

---

### 2.5 Admin Order Detail

**File:** `src/pages/admin/AdminOrderDetail.tsx`

---

#### GET `/api/v1/admin/orders/:id`

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "ORD-2026-001",
    "customerName": "Ahmed Mohamed",
    "customerEmail": "ahmed@example.com",
    "customerPhone": "01012345678",
    "products": [
      {
        "productId": "prod_001",
        "name": "Air Force Classic White",
        "image": "https://cdn.shoex.com/af1.jpg",
        "price": 120.00,
        "quantity": 2,
        "size": 42,
        "color": "White"
      }
    ],
    "total": 240.00,
    "orderStatus": "Confirmed",
    "paymentStatus": "Paid",
    "shippingStatus": "Pending",
    "shippingAddress": "123 Tahrir Square, Cairo, Egypt",
    "trackingNumber": null,
    "transactionId": "TXN-2026-ABC123",
    "notes": "Customer requested gift wrapping.",
    "date": "2026-06-07T10:23:00Z"
  }
}
```

**Frontend Variable Mapping:**
- `data.transactionId` → Payment Details card (was hardcoded `"TXN-2026-PENDING"`)
- `data.trackingNumber` → conditionally shows Shipping Info card

---

### 2.6 Admin Analytics

**File:** `src/pages/admin/AdminAnalytics.tsx`

---

#### GET `/api/v1/admin/analytics`

**Query Params:** `?range=30days` (values: `7days` | `30days` | `90days`)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "revenue": 32400.00,
      "revenueChange": 12.5,
      "orders": 210,
      "ordersChange": 8.2,
      "customers": 234,
      "customersChange": 15.3,
      "avgOrderValue": 154.28,
      "avgOrderValueChange": 3.4
    },
    "revenueChart": [
      { "date": "Jun 1", "revenue": 1200, "orders": 7 }
    ],
    "categoryBreakdown": [
      { "name": "Lifestyle",  "value": 35, "color": "#dc143c" },
      { "name": "Running",    "value": 25, "color": "#ef4444" },
      { "name": "Basketball", "value": 20, "color": "#f87171" },
      { "name": "Casual",     "value": 15, "color": "#fca5a5" },
      { "name": "Training",   "value": 5,  "color": "#fecaca" }
    ],
    "topProducts": [
      {
        "productId": "prod_001",
        "name": "Air Force Classic",
        "sales": 87,
        "revenue": 10440.00
      }
    ]
  }
}
```

> `xChange` fields must be real calculated values (current period vs previous period) — not hardcoded.

#### GET `/api/v1/admin/analytics/export`
**Query Params:** `?range=30days&format=csv`
**Response:** Binary CSV with `Content-Disposition: attachment; filename="analytics-report.csv"`

---

### 2.7 Admin Customers

**File:** `src/pages/admin/AdminCustomers.tsx`

---

#### GET `/api/v1/admin/customers`

**Query Params:** `?search=ahmed&status=Active&sortBy=totalSpent&sortDir=desc&page=1&limit=10`

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cus_001",
      "name": "Ahmed Mohamed",
      "email": "ahmed@example.com",
      "phone": "01012345678",
      "totalSpent": 1240.00,
      "totalOrders": 8,
      "lastPurchase": "2026-06-01T14:30:00Z",
      "joinedDate": "2025-01-15T00:00:00Z",
      "status": "Active"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 234, "totalPages": 24 },
  "aggregates": {
    "totalRevenue": 84320.00,
    "totalOrders": 1204,
    "avgOrderValue": 70.03
  }
}
```

**Frontend Variable Mapping:**
- `data` → `useAdminStore.customers` via `fetchCustomers()`
- `aggregates` → stat cards (Total Revenue, Total Orders, Avg Order Value)

#### PATCH `/api/v1/admin/customers/:id/status`
**Request Body:** `{ "status": "Inactive" }`

#### GET `/api/v1/admin/customers/export`
**Response:** `Content-Type: text/csv`

---

### 2.8 Admin Inventory

**File:** `src/pages/admin/AdminInventory.tsx`

---

#### GET `/api/v1/admin/inventory`

**Query Params:** `?search=air force&status=Low Stock&sortBy=stock&sortDir=asc&page=1&limit=10`

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_001",
      "name": "Air Force Classic White",
      "category": "Lifestyle",
      "sku": "LIF-AIRF-1234",
      "price": 120.00,
      "images": ["https://cdn.shoex.com/af1.jpg"],
      "stock": 3,
      "movement": 5,
      "inventoryValue": 360.00
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 },
  "aggregates": {
    "totalUnits": 842,
    "lowStockCount": 7,
    "outOfStockCount": 2,
    "totalInventoryValue": 98450.00,
    "totalSKUs": 45
  }
}
```

**Field Notes:**
- `movement` — units sold in last 7 days. Positive = sold, negative = restocked. Frontend shows `TrendingUp` for positive, `TrendingDown` for negative.
- `inventoryValue` = `price × stock`

**Stock Status Thresholds:**
```
stock === 0          →  "Out of Stock"
stock > 0 && < 10   →  "Low Stock"
stock >= 10          →  "In Stock"
```

#### PATCH `/api/v1/admin/inventory/:id/stock`
**Request Body:** `{ "stock": 25 }`

---

### 2.9 Admin Shipping

**File:** `src/pages/admin/AdminShipping.tsx`

---

#### GET `/api/v1/admin/shipping/active`

**Success Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "awaitingShipment": 4,
      "inTransit": 12,
      "delivered": 89,
      "failedDeliveries": 2
    },
    "activeShipments": [
      {
        "id": "ORD-2026-001",
        "customerName": "Ahmed Mohamed",
        "shippingAddress": "123 Tahrir Square, Cairo, Egypt",
        "orderStatus": "Shipped",
        "shippingStatus": "In Transit",
        "trackingNumber": "EGX123456789",
        "date": "2026-06-05T09:00:00Z"
      }
    ]
  }
}
```

---

### 2.10 Admin Settings

**File:** `src/pages/admin/AdminSettings.tsx`

> **Unified Response Shape** — All settings nested under section keys. This resolves the shape conflict between previous document versions.

---

#### GET `/api/v1/admin/settings`

**Success Response:**
```json
{
  "success": true,
  "data": {
    "store": {
      "storeName": "SHOEX Store",
      "storeUrl": "shoex.com",
      "storeEmail": "contact@shoex.com",
      "storePhone": "+20 106 363 8026",
      "storeAddress": "123 Commerce Street, Cairo, Egypt",
      "taxId": "XX-XXXXXXX",
      "bizType": "E-commerce",
      "currency": "EGP",
      "timezone": "Africa/Cairo",
      "language": "English",
      "prefs": {
        "enableReviews": true,
        "guestCheckout": true,
        "orderEmails": true,
        "newsletter": false,
        "showOutOfStock": true,
        "maintenanceMode": false
      }
    },
    "payment": {
      "stripeEnabled": true,
      "stripeKeyMasked": "sk_test_****1234",
      "paypalEnabled": false,
      "paypalClientIdMasked": null,
      "cashOnDelivery": true,
      "testMode": true
    },
    "shipping": {
      "freeShippingThreshold": 500,
      "processingDays": 1,
      "locations": [
        { "id": "gov_01", "city": "Cairo",          "rate": 65,  "deliveryDays": "1-2 Days", "isCustom": false },
        { "id": "gov_02", "city": "Giza",           "rate": 65,  "deliveryDays": "1-2 Days", "isCustom": false },
        { "id": "gov_03", "city": "Alexandria",     "rate": 85,  "deliveryDays": "2-3 Days", "isCustom": false },
        { "id": "gov_04", "city": "Dakahlia",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_05", "city": "Red Sea",        "rate": 120, "deliveryDays": "3-4 Days", "isCustom": false },
        { "id": "gov_06", "city": "Beheira",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_07", "city": "Fayoum",         "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_08", "city": "Gharbia",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_09", "city": "Ismailia",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_10", "city": "Monufia",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_11", "city": "Minya",          "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_12", "city": "Qalyubia",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_13", "city": "New Valley",     "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_14", "city": "Sharqia",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_15", "city": "Suez",           "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_16", "city": "Aswan",          "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_17", "city": "Asyut",          "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_18", "city": "Beni Suef",      "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_19", "city": "Port Said",      "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_20", "city": "Damietta",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_21", "city": "South Sinai",    "rate": 120, "deliveryDays": "3-4 Days", "isCustom": false },
        { "id": "gov_22", "city": "Kafr El Sheikh", "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_23", "city": "Matrouh",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_24", "city": "Luxor",          "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_25", "city": "Qena",           "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_26", "city": "Sohag",          "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_27", "city": "North Sinai",    "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false }
      ]
    },
    "notifications": {
      "newOrder": true,
      "lowStock": true,
      "newReview": false,
      "newCustomer": true,
      "dailyReport": false,
      "weeklyReport": true,
      "emailRecipient": "contact@shoex.com"
    },
    "security": {
      "twoFactorEnabled": false,
      "sessionTimeout": 60
    }
  }
}
```

> **Security note:** Never return plain-text secret keys. Masked versions only (e.g. `sk_test_****1234`).

#### `PUT /api/v1/admin/settings/store` — Full `store` object
#### `PUT /api/v1/admin/settings/payment` — Accepts real (unmasked) keys
#### `PUT /api/v1/admin/settings/shipping` — `isCustom: false` cities are immutable
#### `PUT /api/v1/admin/settings/notifications`
#### `POST /api/v1/admin/settings/security/change-password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePass456"
}
```

#### `PUT /api/v1/admin/settings/security/2fa` — Body: `{ "enabled": true }`
#### `PUT /api/v1/admin/settings/security/session-timeout` — Body: `{ "timeoutMinutes": 60 }`

---

### 2.11 Team Management

> All endpoints require `role === "owner"`. Return `403` for any other role.

#### GET `/api/v1/admin/team`

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_001",
      "name": "Store Owner",
      "email": "boodymns@gmail.com",
      "role": "owner",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/v1/admin/team`

**Request Body:**
```json
{
  "name": "Content Editor",
  "email": "editor@shoex.com",
  "password": "temporaryPass123",
  "role": "Editor"
}
```

**Backend Actions:**
1. Hash password (bcrypt, min 12 rounds)
2. Create user record
3. Send onboarding email with login credentials and role summary
4. Return new user object (no password field)

#### PUT `/api/v1/admin/team/:id`
**Request Body:** `{ "name": "Senior Editor", "email": "editor@shoex.com", "role": "Admin" }`

#### DELETE `/api/v1/admin/team/:id`
**Rules:** Cannot delete owner. Must keep at least 1 admin.

---

### 2.12 Admin Notifications *(NEW)*

**Purpose:** Notification bell in the admin layout for real-time alerts.

#### GET `/api/v1/admin/notifications`

**Query Params:** `?page=1&limit=20&unreadOnly=true`

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "type": "new_order",
      "title": "New Order Received",
      "message": "Order ORD-2026-045 placed by Ahmed Hassan",
      "link": "/admin/orders/ORD-2026-045",
      "read": false,
      "createdAt": "2026-06-07T10:23:00.000Z"
    },
    {
      "id": "notif_002",
      "type": "low_stock",
      "title": "Low Stock Alert",
      "message": "Air Force Classic White has only 3 units left",
      "link": "/admin/inventory",
      "read": false,
      "createdAt": "2026-06-07T09:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 },
  "unreadCount": 3
}
```

**Notification Types:** `new_order` | `low_stock` | `new_review` | `new_customer` | `order_cancelled`

#### PATCH `/api/v1/admin/notifications/:id/read`
**Success Response:** `{ "success": true }`

#### PATCH `/api/v1/admin/notifications/read-all`
**Success Response:** `{ "success": true, "data": { "updatedCount": 3 } }`

**Auto-trigger Rules:**
- New order placed → `new_order`
- Product stock drops below 10 → `low_stock`
- New review submitted → `new_review`
- New user registers → `new_customer`
- Order cancelled → `order_cancelled`

---

### 2.13 Feedback Collection *(NEW)*

#### GET `/api/v1/admin/feedback`

**Query Params:** `?page=1&limit=20`

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fb_001",
      "orderId": "ORD-2026-001",
      "customerName": "Ahmed Hassan",
      "feedback": "Great shopping experience!",
      "createdAt": "2026-06-07T10:23:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

---

## 3. Critical Logic & Feature Specifications

### 3.1 Order Status Workflow — Strict Enum

```
New Order → Contacted → Confirmed → Packed → Shipped → Out For Delivery → Delivered
```

Terminal states (no further progression): `Delivered`, `Cancelled`, `Returned`

**Database Implementation:**
```sql
CREATE TYPE order_status AS ENUM (
  'New Order', 'Contacted', 'Confirmed', 'Packed',
  'Shipped', 'Out For Delivery', 'Delivered',
  'Cancelled', 'Returned'
);
```

**Backend Validation:** Reject backward progression with `400 INVALID_STATUS_TRANSITION`.

**WhatsApp Auto-Advance:** When frontend opens WhatsApp for a "New Order", it immediately fires `PATCH /orders/:id/status` with `{ orderStatus: "Contacted" }`.

---

### 3.2 Egypt Shipping Rates — 27 Governorates

1. Seed all 27 governorate records on first run (migration).
2. Mark with `isCustom: false` — `city` names are **immutable**.
3. Only `rate` and `deliveryDays` are editable on standard governorates.
4. Support unlimited custom zones (`isCustom: true`).
5. Match by `city` name (case-insensitive) at checkout.

```sql
CREATE TABLE shipping_zones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city          VARCHAR(100) NOT NULL,
  rate          DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_days VARCHAR(50) NOT NULL,
  is_custom     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.3 Owner-Only Access Control

| Role | Capabilities |
|---|---|
| `owner` | Full access + team management, cannot be deleted |
| `admin` | Full product/order/settings access, no team management |
| `editor` | Products and orders only, no settings |
| `viewer` | Read-only: dashboard and analytics only |

**JWT Payload:**
```json
{
  "sub": "usr_001",
  "email": "sara@shoex.com",
  "role": "admin",
  "isOwner": false,
  "iat": 1717747200,
  "exp": 1718352000
}
```

---

### 3.4 Reviews System *(NEW)*

- User must have a `Delivered` order containing the product to submit a review.
- One review per user per product (DB unique constraint on `user_id + product_id`).
- After new review: recalculate `product.rating = AVG(reviews.rating)` and update `product.reviewCount`.
- Frontend endpoint: `GET /api/v1/products/:id/reviews` and `POST /api/v1/products/:id/reviews`.

---

### 3.5 Product Images — Upload Flow

1. Frontend uploads blob URL files via `POST /api/v1/admin/products/upload-image` (multipart)
2. Backend stores on S3/Cloudinary, returns `{ url: "https://cdn.shoex.com/..." }`
3. Frontend replaces blob URLs with returned CDN URLs
4. CDN URLs included in final product payload

---

### 3.6 Invoice Transaction ID

Add `transactionId: string | null` to `AdminOrder` type and DB schema. Populate from payment gateway webhook (Stripe/PayPal). Return in `GET /admin/orders/:id`. Frontend currently shows `"TXN-2026-PENDING"` as placeholder.

---

### 3.7 Analytics — Per-Product Sales Data

```sql
SELECT
  op.product_id,
  p.name,
  SUM(op.quantity) AS units_sold,
  SUM(op.price * op.quantity) AS revenue
FROM order_products op
JOIN products p ON p.id = op.product_id
JOIN orders o ON o.id = op.order_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
  AND o.order_status != 'Cancelled'
GROUP BY op.product_id, p.name
ORDER BY units_sold DESC
LIMIT 5;
```

---

## 4. Integration Best Practices & Handshake Tips

### 4.1 CORS Configuration

```javascript
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://shoex.com",
    "https://www.shoex.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

### 4.2 Status & Badge String Matching

| Correct ✅ | Wrong ❌ |
|---|---|
| `"New Order"` | `"new_order"` or `"NEW_ORDER"` |
| `"Out For Delivery"` | `"out_for_delivery"` |
| `"In Stock"` | `"in_stock"` |
| `"Low Stock"` | `"low_stock"` |

### 4.3 Low Stock Threshold Consistency

Use `stock < 10` as universal threshold across **all** pages and API queries.

| Page | Old threshold | Correct threshold |
|---|---|---|
| AdminDashboard | `< 10` | `< 10` ✅ |
| AdminInventory | `< 10` | `< 10` ✅ |
| AdminProducts | `<= 5` | `< 10` (update needed) |

### 4.4 TypeScript Interface Alignment

```typescript
interface Product {
  id: string;           // string UUID, not integer
  name: string;
  brand: string;
  price: number;        // float, 2 decimal places
  originalPrice?: number | null;
  images: string[];     // min 1 element, always array
  backgroundImageIndex?: number;
  category: string;
  sizes: number[];
  sizeStocks?: { size: number; stock: number }[];
  colors: { name: string; hex: string }[];
  description: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;     // computed: stock > 0, never stored independently
  stock: number;
  tags: string[];
  sku?: string;
  featured?: boolean;
  status?: "Active" | "Draft" | "Archived";
  weight?: number;
}

interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  products: OrderProduct[];
  total: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingAddress: string;
  trackingNumber?: string;
  transactionId?: string;   // NEW — was hardcoded placeholder
  notes?: string;
  date: string;             // ISO 8601
}

interface Notification {
  id: string;
  type: "new_order" | "low_stock" | "new_review" | "new_customer" | "order_cancelled";
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}
```

### 4.5 Decimal Precision

| Field | DB Type | Notes |
|---|---|---|
| `price` | `DECIMAL(10,2)` | Never return as string |
| `originalPrice` | `DECIMAL(10,2)` nullable | Return `null` when no discount |
| `stock` | `INTEGER` unsigned | Never negative |
| `rating` | `DECIMAL(3,1)` | Range `0.0–5.0` |
| `shippingCost` | `INTEGER` | EGP, whole numbers |
| `images` | `TEXT[]` | Always JSON array |
| `sizeStocks` | `JSONB` | Array of `{ size, stock }` |

### 4.6 Date Format

All dates as **ISO 8601 UTC strings**: `"2026-06-07T10:23:00Z"`

Frontend uses `new Date(date).toLocaleDateString()` — fails with formats like `"07/06/2026"`.

### 4.7 Pagination Standard

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 4.8 Recommended Environment Variables

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FRONTEND_URL=http://localhost:5173
OWNER_EMAIL=boodymns@gmail.com
```

---

*End of SHOEX Backend API Specification Document*
*Version 1.1 — Updated June 2026 — Frontend Architecture Review*
*Changes from v1.0: Added Auth Refresh token endpoint, GET /auth/me, Password Reset flow, Reviews system endpoints, Admin Notifications endpoints, Feedback collection endpoint, unified Settings response shape, Low Stock threshold consistency, transactionId field noted.*