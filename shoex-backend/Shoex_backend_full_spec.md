# SHOEX — Backend API Requirements & Integration Specification

> **Document Version:** 1.1 (Updated)
> **Prepared by:** Frontend Architecture Team
> **Target:** Backend Engineer
> **Stack Context:** React 18 + TypeScript + Zustand + React Router v6
> **Base API URL (dev):** `http://localhost:5000/api`
> **Base API URL (prod):** `https://api.shoex.com/api`

---

## Table of Contents

1. [Project Overview & Global Context](#1-project-overview--global-context)
2. [Authentication](#2-authentication)
3. [Standard Response Format](#3-standard-response-format)
4. [Public User Pages — API Endpoints](#4-public-user-pages--api-endpoints)
5. [Admin Pages — API Endpoints](#5-admin-pages--api-endpoints)
6. [Critical Logic & Feature Specifications](#6-critical-logic--feature-specifications)
7. [TypeScript Interface Reference](#7-typescript-interface-reference)
8. [Integration Best Practices](#8-integration-best-practices)

---

## 1. Project Overview & Global Context

SHOEX is a full-stack sneaker e-commerce platform with two distinct access layers:

- **Public Storefront** — browsable by all visitors; includes Home, Shop, Product Details, Cart, Checkout, Login, Register, and Account pages.
- **Admin Dashboard** — protected behind `ProtectedRoute`; requires a valid JWT with `role: "admin"`. Covers Dashboard, Products, Orders, Analytics, Customers, Inventory, Shipping, and Settings.

The frontend is **already fully built**. All state management runs through Zustand stores (`authStore`, `cartStore`, `adminStore`). Currently, all data comes from local mock files. The backend's job is to replace these mock layers by implementing the endpoints described in this document.

### Global Requirements

| Concern | Spec |
|---|---|
| Auth mechanism | JWT via `Authorization: Bearer <token>` header |
| Token storage | Frontend stores token in `localStorage` via Zustand `persist` middleware (key: `shoex-auth`) |
| API versioning | All endpoints prefixed with `/api/v1/` |
| Date format | ISO 8601 strings — `"2026-05-20T10:30:00.000Z"` |
| Currency | USD for product prices; EGP for shipping costs |
| Pagination | All list endpoints support `?page=1&limit=10` |
| CORS | Allow `http://localhost:5173` (Vite default) in development |

---

## 2. Authentication

### Endpoints

---

#### `POST /api/v1/auth/login`

**Purpose:** Authenticate a user or admin with email + password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "user123"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "phone": "01012345678",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Frontend Mapping:** `useAuthStore → login(user, token)` → stores in `localStorage` under key `shoex-auth`

**Role Routing Logic (frontend):**
```
role === "admin" or "owner"  →  navigate("/admin")
role === "user"              →  navigate("/account")
```

---

#### `POST /api/v1/auth/register`

**Purpose:** Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone": "01012345678"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_002",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "phone": "01012345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `POST /api/v1/auth/google`

**Purpose:** OAuth login via Google.

**Request Body:**
```json
{ "idToken": "GOOGLE_ID_TOKEN_STRING" }
```

**Success Response `200`:** Same shape as login response.

---

#### `POST /api/v1/auth/logout`

**Purpose:** Invalidate server-side session / blacklist JWT.

**Headers:** `Authorization: Bearer <token>`

**Success Response `200`:**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

#### `POST /api/v1/auth/refresh` *(NEW)*

**Purpose:** Exchange a refresh token for a new access token. Called automatically by the frontend Axios interceptor on 401 responses.

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

**Error Response `401`:** Return when refresh token is expired or invalid — frontend will call `logout()` and redirect to `/login`.

---

#### `GET /api/v1/auth/me` *(NEW)*

**Purpose:** Verify token and refresh user data on page reload. Called once on app mount to hydrate `authStore` from a persisted token.

**Headers:** `Authorization: Bearer <token>`

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "01012345678",
    "avatar": null
  }
}
```

**Error Response `401`:** Frontend calls `logout()` and redirects to `/login`.

---

#### `POST /api/v1/auth/forgot-password` *(NEW)*

**Purpose:** Send a password reset email to the user.

**Request Body:**
```json
{ "email": "john@example.com" }
```

**Success Response `200`:**
```json
{ "success": true, "message": "Password reset email sent if account exists." }
```

> **Security note:** Always return 200 even if the email doesn't exist — never confirm whether an account exists.

---

#### `POST /api/v1/auth/reset-password` *(NEW)*

**Purpose:** Set a new password using a reset token from the email link.

**Request Body:**
```json
{
  "resetToken": "abc123...",
  "newPassword": "newSecurePass456"
}
```

**Success Response `200`:**
```json
{ "success": true, "message": "Password updated successfully. Please log in." }
```

**Error Response `400`:** Token expired or invalid.

---

## 3. Standard Response Format

Every endpoint must return one of the following structures:

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```
> `meta` is only included on paginated list responses.

### Error
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product does not exist.",
    "fields": {
      "price": "Must be a positive number"
    }
  }
}
```
> `fields` is optional and used for form-level validation errors.

### Standard HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `204` | Deleted (no body) |
| `400` | Validation error |
| `401` | Unauthenticated |
| `403` | Forbidden (wrong role) |
| `404` | Not found |
| `409` | Conflict (e.g. duplicate email) |
| `500` | Server error |

---

## 4. Public User Pages — API Endpoints

### 4.1 Home Page

#### `GET /api/v1/products?tag=trending`
**Query Params:** `?tag=trending&limit=10`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_001",
      "name": "Apex Runner Nitro",
      "brand": "SHOEX",
      "price": 149.99,
      "originalPrice": null,
      "images": ["https://...jpg"],
      "category": "Running",
      "rating": 4.8,
      "reviewCount": 312,
      "inStock": true,
      "stock": 45,
      "tags": ["trending", "new"],
      "sizes": [39, 40, 41, 42, 43, 44],
      "colors": [{ "name": "Hyper Red", "hex": "#e63946" }],
      "featured": true,
      "status": "Active"
    }
  ]
}
```

Also supports: `?tag=new` and `?tag=limited`

#### `POST /api/v1/newsletter/subscribe`
**Request Body:** `{ "email": "user@example.com" }`
**Success Response `200`:** `{ "success": true, "message": "Subscribed successfully" }`

---

### 4.2 Shop Page

#### `GET /api/v1/products`
**Query Params:**
```
?category=Running&maxPrice=300&size=42
&sort=price-asc  (default | price-asc | price-desc | rating | name-asc)
&page=1&limit=20
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* Product objects */ ],
  "meta": { "page": 1, "limit": 20, "total": 87, "totalPages": 5 }
}
```

#### `GET /api/v1/products/categories`
**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    { "name": "Lifestyle", "count": 14 },
    { "name": "Running",   "count": 9  }
  ]
}
```

---

### 4.3 Product Details Page

#### `GET /api/v1/products/:id`
**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "prod_001",
    "name": "Apex Runner Nitro",
    "brand": "SHOEX",
    "description": "A premium running shoe...",
    "price": 149.99,
    "originalPrice": 199.99,
    "images": ["https://...image1.jpg", "https://...image2.jpg"],
    "backgroundImageIndex": 0,
    "category": "Running",
    "sizes": [39, 40, 41, 42, 43, 44],
    "sizeStocks": [
      { "size": 39, "stock": 3 },
      { "size": 40, "stock": 12 },
      { "size": 41, "stock": 0 },
      { "size": 42, "stock": 8 }
    ],
    "colors": [
      { "name": "Hyper Red",      "hex": "#e63946" },
      { "name": "Midnight Black", "hex": "#111111" }
    ],
    "rating": 4.8,
    "reviewCount": 312,
    "inStock": true,
    "stock": 23,
    "tags": ["trending", "new"],
    "sku": "RUN-APEX-7842",
    "weight": 0.42,
    "featured": true,
    "status": "Active"
  }
}
```

#### `GET /api/v1/products/:id/reviews` *(NEW)*

**Purpose:** Fetch paginated reviews for a product. Used on Product Details page.

**Query Params:** `?page=1&limit=10`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rev_001",
      "userId": "usr_003",
      "userName": "Ahmed H.",
      "rating": 5,
      "comment": "Excellent fit and very comfortable!",
      "date": "2026-05-10T14:00:00.000Z",
      "verified": true
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 312, "totalPages": 32 }
}
```

#### `POST /api/v1/products/:id/reviews` *(NEW)*

**Purpose:** Submit a review for a purchased product. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent fit and very comfortable!"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "rev_002",
    "rating": 5,
    "comment": "Excellent fit and very comfortable!",
    "date": "2026-06-07T10:00:00.000Z"
  }
}
```

**Backend Rules:**
- User must have a `Delivered` order containing this product to submit a review.
- One review per user per product.
- After saving, recalculate and update `product.rating` and `product.reviewCount`.

**Error Response `403`:** `{ "code": "REVIEW_NOT_ALLOWED", "message": "You must purchase this product before reviewing." }`

---

### 4.4 Cart Page

> Cart state is fully managed client-side via `cartStore` with `localStorage` persistence. No cart API needed.

#### `POST /api/v1/promo/validate`
**Request Body:** `{ "code": "SHOEX10" }`
**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "code": "SHOEX10",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrderValue": 0,
    "expiresAt": "2026-12-31T23:59:59.000Z"
  }
}
```
**Error Response `404`:** `{ "success": false, "error": { "code": "INVALID_PROMO", "message": "Promo code not found or expired." } }`

---

### 4.5 Checkout Page

#### `POST /api/v1/orders`

**Request Body:**
```json
{
  "customer": {
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Hassan",
    "phone": "01012345678",
    "altPhone": "01198765432"
  },
  "shippingAddress": {
    "country": "Egypt",
    "governorate": "Cairo",
    "city": "Nasr City",
    "address": "123 El-Nasr St, Building 5",
    "apartment": "Floor 3, Apt 12"
  },
  "items": [
    {
      "productId": "prod_001",
      "name": "Apex Runner Nitro",
      "image": "https://...jpg",
      "price": 149.99,
      "quantity": 2,
      "size": 42,
      "color": "Hyper Red"
    }
  ],
  "subtotal": 299.98,
  "shippingCost": 65,
  "shippingCostCurrency": "EGP",
  "promoCode": "SHOEX10",
  "discount": 29.99,
  "feedback": "Great shopping experience!"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-2026-001",
    "status": "New Order",
    "estimatedDelivery": "2026-06-10T00:00:00.000Z",
    "whatsappConfirmation": true
  }
}
```

**Post-Order Backend Actions:**
1. Save order to DB with `orderStatus: "New Order"` and `paymentStatus: "Pending"`
2. Send WhatsApp message to customer via WhatsApp Business API
3. Send internal notification to admin
4. If `feedback` non-empty, save to `feedback` collection
5. Trigger admin notification (see Section 4.6)

#### `GET /api/v1/shipping/rates`
**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    { "governorate": "Cairo",      "cost": 65,  "currency": "EGP", "deliveryDays": 1 },
    { "governorate": "Giza",       "cost": 65,  "currency": "EGP", "deliveryDays": 1 },
    { "governorate": "Alexandria", "cost": 85,  "currency": "EGP", "deliveryDays": 2 }
  ]
}
```

---

### 4.6 Admin Notifications *(NEW)*

**Purpose:** Support a notification bell in the admin layout for real-time alerts (new orders, low stock, new reviews, new customers).

#### `GET /api/v1/admin/notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Params:** `?page=1&limit=20&unreadOnly=true`

**Success Response `200`:**
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
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1, "unreadCount": 3 }
}
```

**Notification Types:** `new_order` | `low_stock` | `new_review` | `new_customer` | `order_cancelled`

#### `PATCH /api/v1/admin/notifications/:id/read` *(NEW)*

**Purpose:** Mark a single notification as read.

**Success Response `200`:** `{ "success": true }`

#### `PATCH /api/v1/admin/notifications/read-all` *(NEW)*

**Purpose:** Mark all notifications as read.

**Success Response `200`:** `{ "success": true, "data": { "updatedCount": 3 } }`

**Trigger Rules (backend auto-creates notifications when):**
- New order placed → `new_order`
- Product stock drops below 10 → `low_stock`
- New review submitted → `new_review`
- New user registers → `new_customer`
- Order cancelled → `order_cancelled`

---

### 4.7 Feedback Collection *(NEW)*

**Purpose:** Allow admin to view customer feedback submitted during checkout.

#### `GET /api/v1/admin/feedback`

**Headers:** `Authorization: Bearer <token>`

**Query Params:** `?page=1&limit=20`

**Success Response `200`:**
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
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

---

### 4.8 Account Page

#### `GET /api/v1/users/me/orders`
**Headers:** `Authorization: Bearer <token>`
**Query Params:** `?page=1&limit=10`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2026-001",
      "date": "2026-05-20T10:30:00.000Z",
      "status": "Delivered",
      "total": 249.98,
      "trackingNumber": "EG123456789",
      "items": [
        {
          "productId": "prod_001",
          "name": "Apex Runner Nitro",
          "image": "https://...jpg",
          "size": 42,
          "color": "Hyper Red",
          "quantity": 2,
          "price": 124.99
        }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

**Admin → User Status Mapping:**
```
New Order / Contacted / Confirmed / Packed  →  "Processing"
Shipped / Out For Delivery                  →  "In Transit"
Delivered                                   →  "Delivered"
Cancelled                                   →  "Cancelled"
```

#### `GET /api/v1/users/me/wishlist`
#### `POST /api/v1/users/me/wishlist` — Body: `{ "productId": "prod_003" }`
#### `DELETE /api/v1/users/me/wishlist/:productId`
#### `GET /api/v1/users/me/address`
#### `PUT /api/v1/users/me/address`
#### `DELETE /api/v1/users/me/address`

*(Full request/response shapes available in original spec — all unchanged)*

---

## 5. Admin Pages — API Endpoints

> All admin endpoints require `Authorization: Bearer <token>` with `role: "admin"` or `"owner"`.
> Return `403 Forbidden` for non-admin tokens.

### 5.1 Admin Dashboard

#### `GET /api/v1/admin/dashboard/stats`
**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "today": { "revenue": 1250.00, "orders": 8, "avgOrderValue": 156.25 },
    "week": {
      "revenue": 9800.00, "orders": 61, "avgOrderValue": 160.65,
      "revenueTarget": 50000, "revenueTargetPercent": 19.6
    },
    "month": {
      "revenue": 38400.00, "orders": 234, "avgOrderValue": 164.10,
      "newCustomers": 24, "newCustomersTarget": 40,
      "productsSold": 156, "productsSoldTarget": 200
    },
    "pendingOrdersCount": 5,
    "revenueChart": [
      { "date": "Jun 1", "revenue": 1200, "orders": 8 }
    ]
  }
}
```

#### `GET /api/v1/admin/orders?limit=5&sort=date-desc`
#### `GET /api/v1/admin/products?stock_lt=10&limit=5`

---

### 5.2 Admin Products

#### `GET /api/v1/admin/products`
**Query Params:** `?search=air force&page=1&limit=20`

#### `DELETE /api/v1/admin/products/:id`
**Success Response `204`:** (no body)

#### `PATCH /api/v1/admin/products/:id/stock`
**Request Body:** `{ "stock": 25 }`

#### `PATCH /api/v1/admin/products/:id/discount`
**Request Body:** `{ "discountPercent": 20 }`
**Backend Logic:** `originalPrice = product.originalPrice ?? product.price` → `newPrice = originalPrice * (1 - percent/100)`

#### `PATCH /api/v1/admin/products/:id/discount/remove`

---

### 5.3 Add Product

#### `POST /api/v1/admin/products`
**Request Body:**
```json
{
  "name": "Air Force Classic White",
  "brand": "SHOEX",
  "category": "Lifestyle",
  "description": "A timeless classic...",
  "tags": ["trending", "classic"],
  "images": ["https://...image1.jpg"],
  "backgroundImageIndex": 0,
  "price": 119.99,
  "originalPrice": 149.99,
  "stock": 85,
  "sizeStocks": [
    { "size": 40, "stock": 10 },
    { "size": 41, "stock": 15 }
  ],
  "sizes": [40, 41, 42],
  "colors": [{ "name": "White", "hex": "#ffffff" }],
  "sku": "LIF-AIRF-3841",
  "weight": 0.45,
  "featured": true,
  "status": "Active"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "prod_099",
    "name": "Air Force Classic White",
    "sku": "LIF-AIRF-3841",
    "status": "Active",
    "createdAt": "2026-06-07T10:00:00.000Z"
  }
}
```

> **Status Handling:** The frontend passes `status` directly as `"Active"` or `"Draft"` — never rely on a separate state field.

#### `POST /api/v1/admin/products/upload-image`
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

---

### 5.4 Edit Product

#### `GET /api/v1/admin/products/:id`
*(Same shape as `GET /api/v1/products/:id`)*

#### `PUT /api/v1/admin/products/:id`
**Request Body:** Same shape as POST.

---

### 5.5 Admin Orders

#### `GET /api/v1/admin/orders`
**Query Params:** `?search=ahmed&orderStatus=New Order&paymentStatus=Pending&page=1&limit=20`

**Sorting Rule:** New Orders always appear first, then by `date` descending.

#### `PATCH /api/v1/admin/orders/:id/status`
**Request Body:** `{ "orderStatus": "Confirmed" }`
**Valid Enum:** `"New Order"` | `"Contacted"` | `"Confirmed"` | `"Packed"` | `"Shipped"` | `"Out For Delivery"` | `"Delivered"` | `"Cancelled"` | `"Returned"`

#### `PATCH /api/v1/admin/orders/:id/payment-status`
**Request Body:** `{ "paymentStatus": "Paid" }`

#### `PATCH /api/v1/admin/orders/:id/tracking`
**Request Body:** `{ "trackingNumber": "EG123456789" }`

#### `PATCH /api/v1/admin/orders/:id/notes`
**Request Body:** `{ "notes": "Customer requested gift wrapping." }`

#### `GET /api/v1/admin/orders/export`
**Response:** `Content-Type: text/csv` with `Content-Disposition: attachment; filename="orders-2026-06-07.csv"`

---

### 5.6 Admin Order Detail

#### `GET /api/v1/admin/orders/:id`
**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "ORD-2026-001",
    "customerName": "Ahmed Hassan",
    "customerEmail": "ahmed@example.com",
    "customerPhone": "+20 101 234 5678",
    "products": [
      {
        "productId": "prod_001",
        "name": "Apex Runner Nitro",
        "image": "https://...jpg",
        "price": 149.99,
        "quantity": 2,
        "size": 42,
        "color": "Hyper Red"
      }
    ],
    "total": 299.98,
    "orderStatus": "Confirmed",
    "paymentStatus": "Paid",
    "shippingStatus": "Pending",
    "shippingAddress": "123 El-Nasr St, Nasr City, Cairo",
    "trackingNumber": null,
    "transactionId": "TXN-2026-ABC123",
    "notes": "Customer requested gift wrapping.",
    "date": "2026-06-07T09:15:00.000Z"
  }
}
```

> `transactionId` was a hardcoded placeholder (`TXN-2026-PENDING`) — must be real value from payment gateway. Add `transactionId?: string` to `AdminOrder` type.

---

### 5.7 Admin Analytics

#### `GET /api/v1/admin/analytics`
**Query Params:** `?range=30` (values: `7` | `30` | `90`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 38400.00,
      "totalOrders": 234,
      "totalCustomers": 198,
      "avgOrderValue": 164.10,
      "revenueChange": 12.5,
      "ordersChange": 8.2,
      "customersChange": 15.3,
      "avgOrderValueChange": 3.4
    },
    "revenueChart": [
      { "date": "May 8", "revenue": 1200, "orders": 8 }
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
        "name": "Apex Runner",
        "sales": 87,
        "revenue": 13049.13
      }
    ]
  }
}
```

> `xChange` fields must be real calculated values comparing current period vs previous period — not hardcoded.

#### `GET /api/v1/admin/analytics/export`
**Query Params:** `?range=30`
**Response:** Binary CSV file.

---

### 5.8 Admin Customers

#### `GET /api/v1/admin/customers`
**Query Params:** `?search=ahmed&status=Active&sort=totalSpent&order=desc&page=1&limit=10`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust_001",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "phone": "+20 101 234 5678",
      "totalSpent": 1249.95,
      "totalOrders": 8,
      "lastPurchase": "2026-05-20T10:30:00.000Z",
      "joinedDate": "2025-12-01T00:00:00.000Z",
      "status": "Active"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 198, "totalPages": 20 }
}
```

#### `PATCH /api/v1/admin/customers/:id/status`
**Request Body:** `{ "status": "Inactive" }`

#### `GET /api/v1/admin/customers/export`
**Response:** `Content-Type: text/csv`

---

### 5.9 Admin Inventory

#### `GET /api/v1/admin/inventory`
**Query Params:** `?search=runner&status=Low Stock&sort=stock&order=asc&page=1&limit=10`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_001",
      "name": "Apex Runner Nitro",
      "category": "Running",
      "images": ["https://...jpg"],
      "sku": "RUN-APEX-7842",
      "price": 149.99,
      "stock": 7,
      "movement7d": -3,
      "inventoryValue": 1049.93,
      "status": "Low Stock"
    }
  ],
  "meta": {
    "page": 1, "limit": 10, "total": 87, "totalPages": 9,
    "summary": {
      "totalUnits": 1240,
      "lowStockCount": 8,
      "outOfStockCount": 3,
      "totalValue": 186500.00,
      "skuCount": 87
    }
  }
}
```

**Stock Thresholds:**
```
stock === 0          →  "Out of Stock"
stock > 0 && < 10   →  "Low Stock"
stock >= 10          →  "In Stock"
```

#### `PATCH /api/v1/admin/inventory/:id/stock`
**Request Body:** `{ "stock": 25 }`

---

### 5.10 Admin Shipping

#### `GET /api/v1/admin/shipping`
**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "awaitingShipment": 4,
      "inTransit": 7,
      "delivered": 23,
      "failedDeliveries": 1
    },
    "activeShipments": [
      {
        "orderId": "ORD-2026-005",
        "customerName": "Sara Ahmed",
        "shippingAddress": "45 Tahrir Sq, Cairo",
        "orderStatus": "Shipped",
        "shippingStatus": "In Transit",
        "trackingNumber": "EG123456789"
      }
    ]
  }
}
```

---

### 5.11 Admin Settings

> **Unified Response Shape** (resolves conflict between previous document versions):
> All settings are returned nested under section keys (`store`, `payment`, `shipping`, etc.)

#### `GET /api/v1/admin/settings`
**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "store": {
      "storeName": "SHOEX Store",
      "storeUrl": "https://shoex.com",
      "storeEmail": "contact@shoex.com",
      "storePhone": "+20 106 363 8026",
      "storeAddress": "Cairo, Egypt",
      "taxId": "TAX-123456",
      "businessType": "E-Commerce",
      "currency": "EGP",
      "timezone": "Africa/Cairo",
      "language": "English",
      "preferences": {
        "enableReviews": true,
        "showOutOfStock": true,
        "enableWishlist": true,
        "guestCheckout": true,
        "orderEmails": true,
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
        { "id": "gov_01", "city": "Cairo",       "rate": 65,  "deliveryDays": "1-2 Days", "isCustom": false },
        { "id": "gov_02", "city": "Giza",        "rate": 65,  "deliveryDays": "1-2 Days", "isCustom": false },
        { "id": "gov_03", "city": "Alexandria",  "rate": 85,  "deliveryDays": "2-3 Days", "isCustom": false },
        { "id": "gov_04", "city": "Dakahlia",    "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_05", "city": "Red Sea",     "rate": 120, "deliveryDays": "3-4 Days", "isCustom": false },
        { "id": "gov_06", "city": "Beheira",     "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_07", "city": "Fayoum",      "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_08", "city": "Gharbia",     "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_09", "city": "Ismailia",    "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_10", "city": "Monufia",     "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_11", "city": "Minya",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_12", "city": "Qalyubia",    "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_13", "city": "New Valley",  "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_14", "city": "Sharqia",     "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_15", "city": "Suez",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_16", "city": "Aswan",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_17", "city": "Asyut",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_18", "city": "Beni Suef",   "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_19", "city": "Port Said",   "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_20", "city": "Damietta",    "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_21", "city": "South Sinai", "rate": 120, "deliveryDays": "3-4 Days", "isCustom": false },
        { "id": "gov_22", "city": "Kafr El Sheikh", "rate": 90, "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_23", "city": "Matrouh",     "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_24", "city": "Luxor",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_25", "city": "Qena",        "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_26", "city": "Sohag",       "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false },
        { "id": "gov_27", "city": "North Sinai", "rate": 90,  "deliveryDays": "3-5 Days", "isCustom": false }
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

> **Security note:** Never return plain-text secret keys. Return masked versions only (e.g. `sk_test_****1234`).

#### `PUT /api/v1/admin/settings/store`
**Request Body:** Full `store` object.

#### `PUT /api/v1/admin/settings/payment`
**Request Body:** Accepts real (unmasked) keys — store securely.

#### `PUT /api/v1/admin/settings/shipping`
**Backend Rules:**
- `isCustom: false` records → only `rate` and `deliveryDays` are editable; `city` is immutable.
- `isCustom: true` records → fully editable and deletable.

#### `PUT /api/v1/admin/settings/notifications`

#### `POST /api/v1/admin/settings/security/change-password`
**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePass456"
}
```

#### `PUT /api/v1/admin/settings/security/2fa`
**Request Body:** `{ "enabled": true }`

#### `PUT /api/v1/admin/settings/security/session-timeout`
**Request Body:** `{ "timeoutMinutes": 60 }`

---

### 5.12 Team Management

> All endpoints require `role === "owner"`. Return `403` for any other role.

#### `GET /api/v1/admin/team`
**Success Response `200`:**
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

#### `POST /api/v1/admin/team`
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
3. Send onboarding email with login credentials
4. Return new user object (no password field)

#### `PUT /api/v1/admin/team/:id`
**Request Body:** `{ "name": "Senior Editor", "email": "editor@shoex.com", "role": "Admin" }`

#### `DELETE /api/v1/admin/team/:id`
**Rules:** Cannot delete owner account. Must have at least 1 admin remaining.

---

## 6. Critical Logic & Feature Specifications

### 6.1 Order Status Workflow

```
New Order → Contacted → Confirmed → Packed → Shipped → Out For Delivery → Delivered
```

Terminal states: `Delivered`, `Cancelled`, `Returned`

Backend must reject invalid transitions:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'Delivered' to 'New Order'."
  }
}
```

### 6.2 Egypt Shipping Rates — 27 Governorates

Seed all 27 governorates on first run. Mark with `isCustom: false`. Only `rate` and `deliveryDays` are editable on standard governorates.

### 6.3 Owner-Only Access Control

| Role | Capabilities |
|---|---|
| `owner` | Full access including team management, cannot be deleted |
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

### 6.4 Reviews System

- User must have a delivered order containing the product to submit a review.
- One review per user per product (enforce at DB level with unique constraint).
- After new review: recalculate `product.rating = AVG(reviews.rating)` and update `product.reviewCount`.

### 6.5 Analytics — Per-Product Sales Data

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

### 6.6 Promo Code System

`promoCodes` collection fields:
- `code` (unique), `discountType`: `"percentage"` | `"fixed"`, `discountValue`, `minOrderValue`, `maxUses`, `usedCount`, `expiresAt`, `isActive`

### 6.7 Product Image Upload Flow

1. Frontend uploads via `POST /api/v1/admin/products/upload-image` (multipart)
2. Backend stores on S3/Cloudinary, returns CDN URL
3. Frontend replaces blob URL with CDN URL
4. CDN URL included in final product payload

---

## 7. TypeScript Interface Reference

```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  backgroundImageIndex?: number;
  category: string;
  sizes: number[];
  sizeStocks?: { size: number; stock: number }[];
  colors: { name: string; hex: string }[];
  description: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;       // must equal stock > 0 — computed on write
  stock: number;
  tags: string[];
  sku?: string;
  featured?: boolean;
  status?: "Active" | "Draft" | "Archived";
  weight?: number;
}

type OrderStatus =
  | "New Order" | "Contacted" | "Confirmed" | "Packed"
  | "Shipped" | "Out For Delivery" | "Delivered"
  | "Cancelled" | "Returned";

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";
type ShippingStatus = "Pending" | "In Transit" | "Delivered" | "Failed";

interface OrderProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: number;
  color?: string;
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
  transactionId?: string;
  notes?: string;
  date: string;
}

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  joinedDate: string;
  status: "Active" | "Inactive";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "owner";
  avatar?: string;
  phone?: string;
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

interface Notification {
  id: string;
  type: "new_order" | "low_stock" | "new_review" | "new_customer" | "order_cancelled";
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}
```

---

## 8. Integration Best Practices

### 8.1 CORS Configuration

```javascript
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://shoex.com",
    "https://www.shoex.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

### 8.2 Status String Consistency

The frontend uses exact string matching for badge colors. Any deviation breaks the UI silently.

| Correct ✅ | Wrong ❌ |
|---|---|
| `"New Order"` | `"new_order"` or `"NEW_ORDER"` |
| `"Out For Delivery"` | `"out_for_delivery"` |
| `"In Stock"` | `"in_stock"` |
| `"Low Stock"` | `"low_stock"` |

### 8.3 Low Stock Threshold Consistency

Use `stock < 10` as the universal threshold across all pages and API queries.

| Page | Threshold |
|---|---|
| AdminDashboard Low Stock Alerts | `stock < 10` |
| AdminInventory Status filter | `stock < 10` |
| AdminProducts Stock badge | `stock < 10` (update from previous `<= 5`) |

### 8.4 Decimal Precision

| Field | DB Type | Notes |
|---|---|---|
| `price` | `DECIMAL(10,2)` | Never return as string |
| `originalPrice` | `DECIMAL(10,2)` nullable | Return `null` when no discount |
| `stock` | `INTEGER` unsigned | Never negative |
| `rating` | `DECIMAL(3,1)` | Range `0.0–5.0` |
| `shippingCost` | `INTEGER` | EGP, whole numbers |
| `images` | `TEXT[]` | Always JSON array, never string |
| `sizeStocks` | `JSONB` | Array of `{ size, stock }` |

### 8.5 Pagination Contract

```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 198,
    "totalPages": 20
  }
}
```

### 8.6 JWT Expiry & Refresh

- Access token expiry: `7 days`
- On `401` → frontend Axios interceptor calls `POST /api/v1/auth/refresh`
- If refresh fails → `logout()` + redirect to `/login`

### 8.7 Recommended Environment Variables

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

*End of SHOEX Backend API Requirements & Integration Specification*
*Version 1.1 — Updated June 2026 — Frontend Architecture Team*
*Changes from v1.0: Added Auth Refresh token, GET /auth/me, Password Reset flow, Reviews system, Notifications system, Feedback collection endpoint, unified Settings response shape, Low Stock threshold consistency note.*