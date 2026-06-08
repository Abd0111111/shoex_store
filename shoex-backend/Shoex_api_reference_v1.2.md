# SHOEX Backend — API Reference Guide

> **Base URL (dev):** `http://localhost:5000/api/v1`
> **Base URL (prod):** `https://api.shoex.com/api/v1`
> **Version:** 1.2
> **Date:** June 2026

---

## 📋 فهرس

1. [Auth](#1-auth)
2. [Public — Products & Reviews](#2-public--products--reviews)
3. [Public — Orders & Checkout](#3-public--orders--checkout)
4. [Public — Shipping & Promo](#4-public--shipping--promo)
5. [User Account](#5-user-account)
6. [Admin — Dashboard](#6-admin--dashboard)
7. [Admin — Products](#7-admin--products)
8. [Admin — Orders](#8-admin--orders)
9. [Admin — Customers](#9-admin--customers)
10. [Admin — Inventory](#10-admin--inventory)
11. [Admin — Analytics](#11-admin--analytics)
12. [Admin — Shipping](#12-admin--shipping)
13. [Admin — Notifications](#13-admin--notifications)
14. [Admin — Feedback](#14-admin--feedback)
15. [Admin — Settings](#15-admin--settings)
16. [Admin — Team](#16-admin--team)

---

## ⚙️ Global Rules

### Authentication
كل الـ Admin endpoints محتاجة:
```
Authorization: Bearer <token>
```

### Standard Success Response
```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Error Codes
| Code | HTTP Status |
|---|---|
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 422 |
| `CONFLICT` | 409 |
| `INVALID_STATUS_TRANSITION` | 400 |
| `REVIEW_NOT_ALLOWED` | 403 |
| `SERVER_ERROR` | 500 |
| `INVALID_PROMO` | 404 |

### Joi Validation
كل الـ endpoints دلوقتي محمية بـ Joi validation middleware. أي request بـ body غلط بيرجع:
```json
{
  "success": false,
  "error": "Field-level error message",
  "code": "VALIDATION_ERROR"
}
```
HTTP Status: `422`

---

## 1. Auth

### `POST /auth/login`
**Validation:** email required, password min 6 chars
**Request:**
```json
{
  "email": "boodymns@gmail.com",
  "password": "Admin@123456"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "6a24d149...",
      "name": "Store Owner",
      "email": "boodymns@gmail.com",
      "role": "owner",
      "isOwner": true,
      "phone": "01063638026",
      "avatar": null
    }
  }
}
```
> **Role Routing:** `admin/owner` → `/admin` | `user` → `/account`

---

### `POST /auth/register`
**Validation:** name min 2 chars, valid email, password min 6, phone Egyptian format optional
**Request:**
```json
{
  "name": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "password": "securepass123",
  "phone": "01012345678"
}
```
**Response (201):** نفس شكل login
> ✅ Backend بيـfire `notifyNewCustomer` تلقائياً

---

### `POST /auth/google`
**Validation:** idToken required
**Request:**
```json
{ "idToken": "GOOGLE_ID_TOKEN_STRING" }
```
**Response:** نفس شكل login — `201` لو user جديد، `200` لو موجود
> - ✅ User مش موجود → ينشأ account جديد + notify admin
> - ✅ User موجود بدون avatar → يتحدث الـ avatar من Google
> - ❌ User inactive → `403 FORBIDDEN`

---

### `POST /auth/logout`
**Headers:** `Authorization: Bearer <token>`
**Request:** لا يحتاج body
**Response:**
```json
{ "success": true, "message": "Logged out successfully" }
```
> ✅ بيـclear الـ refreshToken من الـ DB

---

### `GET /auth/me`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6a24d149...",
    "name": "Store Owner",
    "email": "boodymns@gmail.com",
    "role": "owner",
    "isOwner": true,
    "phone": "01063638026",
    "avatar": null
  }
}
```
> يُستخدم عند reload الصفحة لتحديث بيانات الـ user

---

### `POST /auth/refresh`
**Validation:** refreshToken required
**Request:**
```json
{ "refreshToken": "eyJ..." }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 604800
  }
}
```
> - يُستدعى تلقائياً من Axios interceptor عند رجوع 401
> - ✅ بيـrotate الـ refreshToken في كل call (يُعاد إصداره)
> - ❌ Token غلط أو مش موجود في الـ DB → `401`

---

### `POST /auth/forgot-password`
**Validation:** valid email required
**Request:**
```json
{ "email": "ahmed@example.com" }
```
**Response:**
```json
{ "success": true, "message": "Password reset email sent if account exists." }
```
> ✅ دايماً يرجع 200 حتى لو الإيميل مش موجود (security)
> ✅ Token ينتهي بعد 60 دقيقة

---

### `POST /auth/reset-password`
**Validation:** resetToken required, newPassword min 6
**Request:**
```json
{
  "resetToken": "abc123...",
  "newPassword": "newSecurePass456"
}
```
**Response:**
```json
{ "success": true, "message": "Password updated successfully. Please log in." }
```
> ✅ بيـclear الـ resetToken والـ refreshToken بعد الـ reset
> **Error (400):** Token expired or invalid

---

### `POST /admin/settings/security/change-password`
**Validation:** currentPassword required, newPassword min 6, confirmNewPassword must match
**Request:**
```json
{
  "currentPassword": "Admin@123456",
  "newPassword": "NewPass@789",
  "confirmNewPassword": "NewPass@789"
}
```

---

## 2. Public — Products & Reviews

### `GET /products`
**Query Params:**
| Param | Type | مثال | الوصف |
|---|---|---|---|
| `category` | string | `Lifestyle` | فلتر بالكاتيجوري |
| `maxPrice` | number | `300` | أقصى سعر |
| `size` | number | `42` | فلتر بالمقاس |
| `sort` | string | `price-asc` | الترتيب |
| `tag` | string | `trending` | فلتر بالتاج |
| `page` | number | `1` | رقم الصفحة |
| `limit` | number | `20` | عدد النتائج |
| `search` | string | `air force` | بحث نصي |

**Sort Values:** `default` | `price-asc` | `price-desc` | `rating` | `name-asc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a2568ff...",
      "name": "Air Force Classic White",
      "brand": "SHOEX",
      "category": "Lifestyle",
      "description": "Timeless classic design...",
      "tags": ["classic", "lifestyle", "trending"],
      "images": ["https://..."],
      "backgroundImageIndex": 0,
      "price": 120,
      "originalPrice": null,
      "stock": 24,
      "sizeStocks": [
        { "size": 40, "stock": 5 },
        { "size": 41, "stock": 8 },
        { "size": 42, "stock": 11 }
      ],
      "sizes": [40, 41, 42],
      "colors": [{ "name": "White", "hex": "#ffffff" }],
      "sku": "LIF-AIRF-1234",
      "weight": null,
      "rating": 0,
      "reviewCount": 0,
      "featured": true,
      "status": "Active",
      "inStock": true,
      "createdAt": "2026-06-07T...",
      "updatedAt": "2026-06-07T..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

### `GET /products/categories`
**Response:**
```json
{
  "success": true,
  "data": [
    { "name": "Lifestyle", "count": 5 },
    { "name": "Running", "count": 3 }
  ]
}
```

---

### `GET /products/:id`
**Response:** نفس شكل product object بالكامل

---

### `GET /products/:id/reviews`
**Query Params:** `?page=1&limit=10`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6a256c42...",
      "userId": "6a24d149...",
      "userName": "Ahmed M.",
      "rating": 5,
      "comment": "Excellent fit and very comfortable!",
      "date": "2026-06-07T...",
      "verified": true
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 312, "totalPages": 32 }
}
```

---

### `POST /products/:id/reviews`
**Headers:** `Authorization: Bearer <token>` (required)
**Validation:** rating 1-5 required, comment min 10 / max 500 chars
**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent fit and very comfortable!"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "6a256c42...",
    "rating": 5,
    "comment": "Excellent fit and very comfortable!",
    "date": "2026-06-07T..."
  }
}
```
**Backend Rules:**
- ✅ `verified: true` تلقائياً لأن الـ check بيتأكد من الـ order
- ✅ بعد الـ review: بيحسب `product.rating = AVG` و يحدث `product.reviewCount`
- ✅ يـfire `new_review` notification للـ admin
- ❌ ليس له order Delivered بهذا المنتج → `403 REVIEW_NOT_ALLOWED`
- ❌ عمل review قبل كده → `409 CONFLICT`

---

## 3. Public — Orders & Checkout

### `POST /orders`
**Validation:** customer (name, email, Egyptian phone), shippingAddress (governorate, city, address required), items min 1, كل item فيه productId/name/image/price/quantity/size
**Request:**
```json
{
  "customer": {
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "phone": "01012345678",
    "altPhone": null
  },
  "shippingAddress": {
    "country": "Egypt",
    "governorate": "Cairo",
    "city": "Nasr City",
    "address": "123 El-Nasr St",
    "apartment": "Apt 12"
  },
  "items": [
    {
      "productId": "6a2568ff...",
      "name": "Air Force Classic White",
      "image": "https://...",
      "price": 120.00,
      "quantity": 2,
      "size": 42,
      "color": "White"
    }
  ],
  "subtotal": 240.00,
  "shippingCost": 65,
  "discount": 0,
  "promoCode": null,
  "feedback": "Great shopping experience!"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-2026-001",
    "status": "New Order",
    "estimatedDelivery": "2026-06-10T...",
    "whatsappConfirmation": true
  }
}
```
**Post-Order Actions (automatic):**
- ✅ خصم الـ stock من المنتجات
- ✅ إرسال WhatsApp للعميل
- ✅ إنشاء `new_order` notification للـ admin
- ✅ حفظ الـ feedback لو موجود
- ✅ زيادة `usedCount` للـ promo code

---

## 4. Public — Shipping & Promo

### `GET /shipping/rates`
**Response:**
```json
{
  "success": true,
  "data": [
    { "governorate": "Cairo",      "cost": 65,  "currency": "EGP", "deliveryDays": "1-2 Days" },
    { "governorate": "Giza",       "cost": 65,  "currency": "EGP", "deliveryDays": "1-2 Days" },
    { "governorate": "Alexandria", "cost": 85,  "currency": "EGP", "deliveryDays": "2-3 Days" }
  ]
}
```
> يرجع 27 محافظة كاملة

---

### `POST /promo/validate`
**Request:**
```json
{ "code": "SHOEX10" }
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "code": "SHOEX10",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrderValue": 0,
    "expiresAt": "2026-12-31T..."
  }
}
```
**Error (404):**
```json
{ "success": false, "error": "Promo code not found or expired.", "code": "INVALID_PROMO" }
```

---

### `POST /newsletter/subscribe`
**Validation:** valid email required
**Request:**
```json
{ "email": "user@example.com" }
```
**Response:**
```json
{ "success": true, "message": "Subscribed successfully" }
```
> ✅ دايماً يرجع 200 حتى لو الإيميل مسجل قبل كده (لا يكشف عن وجوده)

---

## 5. User Account

> كل الـ endpoints دي محتاجة `Authorization: Bearer <token>` (user أو admin)

### `GET /users/me/orders`
**Query Params:** `?page=1&limit=10`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2026-001",
      "date": "2026-06-07T...",
      "status": "Processing",
      "total": 305,
      "trackingNumber": null,
      "items": [
        {
          "productId": "6a2568ff...",
          "name": "Air Force Classic White",
          "image": "https://...",
          "size": 42,
          "color": "White",
          "quantity": 2,
          "price": 120
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```
**Admin → User Status Mapping:**
```
New Order / Contacted / Confirmed / Packed  →  "Processing"
Shipped / Out For Delivery                  →  "In Transit"
Delivered                                   →  "Delivered"
Cancelled / Returned                        →  "Cancelled"
```

---

### `GET /users/me/wishlist`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a2568ff...",
      "name": "Air Force Classic White",
      "price": 120,
      "originalPrice": null,
      "images": ["https://..."],
      "category": "Lifestyle",
      "rating": 4.5,
      "reviewCount": 12,
      "inStock": true,
      "stock": 24
    }
  ]
}
```
> ✅ بيـpopulate الـ products الحقيقية — لو product اتحذف أو status ≠ Active مش بيظهر

---

### `POST /users/me/wishlist`
**Validation:** productId required
**Request:**
```json
{ "productId": "6a2568ff..." }
```
**Response (201):**
```json
{ "success": true, "data": { "productId": "6a2568ff..." }, "message": "Added to wishlist" }
```
**Error (404):** Product not found
**Error (409):** Already in wishlist

---

### `DELETE /users/me/wishlist/:productId`
**Response:**
```json
{ "success": true, "message": "Removed from wishlist" }
```

---

### `GET /users/me/address`
**Response:**
```json
{
  "success": true,
  "data": {
    "country": "Egypt",
    "governorate": "Cairo",
    "city": "Nasr City",
    "address": "123 El-Nasr St",
    "apartment": "Apt 12"
  }
}
```

---

### `PUT /users/me/address`
**Validation:** governorate, city, address required
**Request:**
```json
{
  "country": "Egypt",
  "governorate": "Cairo",
  "city": "Nasr City",
  "address": "123 El-Nasr St",
  "apartment": "Apt 12"
}
```
**Response:**
```json
{ "success": true, "data": { ... }, "message": "Address updated successfully" }
```

---

### `DELETE /users/me/address`
**Response:**
```json
{ "success": true, "message": "Address deleted successfully" }
```
> ✅ بيـreset كل الـ address fields لـ null

---

## 6. Admin — Dashboard

> كل الـ endpoints دي محتاجة `Authorization: Bearer <token>`

### `GET /admin/dashboard/stats`
**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "revenue": 610,
      "orders": 2,
      "avgOrderValue": 305,
      "newCustomers": 0
    },
    "week": {
      "revenue": 610,
      "orders": 2
    },
    "month": {
      "revenue": 610,
      "orders": 2,
      "avgOrderValue": 305,
      "newCustomers": 1
    },
    "pendingOrdersCount": 1,
    "weeklyRevenueTarget": 50000,
    "monthlyCustomersTarget": 40,
    "monthlyProductsSoldTarget": 200,
    "productsSoldThisMonth": 4,
    "revenueChart": [
      { "date": "Mon", "revenue": 0,   "orders": 0 },
      { "date": "Sun", "revenue": 610, "orders": 2 }
    ]
  }
}
```

---

### `GET /admin/dashboard/recent-orders`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2026-001",
      "customerName": "Ahmed Mohamed",
      "customerPhone": "01012345678",
      "total": 305,
      "orderStatus": "New Order",
      "date": "2026-06-07T..."
    }
  ]
}
```
> يرجع آخر 5 orders

---

### `GET /admin/dashboard/low-stock`
**Query Params:** `?threshold=10` (default: 10)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a2568ff...",
      "name": "Air Force Classic White",
      "category": "Lifestyle",
      "images": ["https://..."],
      "stock": 3
    }
  ]
}
```

---

## 7. Admin — Products

### `GET /admin/products`
**Query Params:**
| Param | Type | مثال |
|---|---|---|
| `search` | string | `air force` |
| `category` | string | `Lifestyle` |
| `sortBy` | string | `createdAt` |
| `sortDir` | string | `asc` / `desc` |
| `page` | number | `1` |
| `limit` | number | `10` |

**Response:** Paginated list of products (نفس شكل public products)

---

### `POST /admin/products`
**Validation:** name, category (enum), description, images (min 1 URL), price (min 0), stock (min 0) required
**Request:**
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
  "originalPrice": null,
  "stock": 24,
  "sizeStocks": [
    { "size": 40, "stock": 5 },
    { "size": 41, "stock": 8 },
    { "size": 42, "stock": 11 }
  ],
  "sizes": [40, 41, 42],
  "colors": [{ "name": "White", "hex": "#ffffff" }],
  "sku": "LIF-AIRF-1234",
  "weight": 0.8,
  "featured": true,
  "status": "Active"
}
```
**Response (201):** Full product object

---

### `POST /admin/products/upload-image`
**Request:** `multipart/form-data` — field name: `image`
**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.shoex.com/products/...",
    "key": "shoex/products/..."
  }
}
```
> ⚠️ ارفع الصورة أول وبعدين استخدم الـ URL في الـ product payload

---

### `PUT /admin/products/:id`
**Validation:** نفس POST لكن كل الـ fields اختيارية
**Request:** نفس شكل POST
**Response:** Updated full product object

---

### `DELETE /admin/products/:id`
**Response:**
```json
{ "success": true, "message": "Product deleted successfully", "data": null }
```

---

### `PATCH /admin/products/:id/discount`
**Validation:** discountPercent 1-99 required
**Request:**
```json
{ "discountPercent": 20 }
```
**Response:** Updated product — `price` انخفض و `originalPrice` اتحفظ
> **Logic:** `originalPrice = product.originalPrice ?? product.price` ← يحافظ على السعر الأصلي لو في خصم قديم

---

### `PATCH /admin/products/:id/discount/remove`
**Request:** لا يحتاج body
**Response:** Updated product — `price` رجع للـ `originalPrice` و `originalPrice = null`

---

### `PATCH /admin/products/:id/stock`
**Validation:** stock min 0 required
**Request:**
```json
{ "stock": 50 }
```
**Response:** Updated product object

---

## 8. Admin — Orders

### `GET /admin/orders`
**Query Params:**
| Param | Type | مثال |
|---|---|---|
| `search` | string | `ahmed` |
| `orderStatus` | string | `New Order` |
| `paymentStatus` | string | `Pending` |
| `page` | number | `1` |
| `limit` | number | `50` |

**Response:** Paginated list — New Orders دايماً أول، ثم بالتاريخ تنازلياً

```json
{
  "success": true,
  "data": [ { ... } ],
  "pagination": { "page": 1, "limit": 50, "total": 2, "totalPages": 1 },
  "statusCounts": {
    "total": 10,
    "newOrders": 2,
    "contacted": 1,
    "confirmed": 1,
    "packed": 0,
    "shipped": 1,
    "outForDelivery": 0,
    "delivered": 4,
    "cancelled": 1,
    "returned": 0
  }
}
```
> ⭐ **v1.1:** أضفنا `statusCounts` في الـ response — بيُحسب على كل الـ orders (مش على الـ filtered list) عشان الـ stat cards دايماً تكون صح بغض النظر عن الـ pagination

---

### `GET /admin/orders/:id`
> `:id` = `orderId` مثل `ORD-2026-001` مش الـ MongoDB `_id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ORD-2026-001",
    "customerName": "Ahmed Mohamed",
    "customerEmail": "ahmed@example.com",
    "customerPhone": "01012345678",
    "products": [ { } ],
    "total": 305,
    "orderStatus": "New Order",
    "paymentStatus": "Pending",
    "shippingStatus": "Pending",
    "shippingAddress": "123 El-Nasr St, Nasr City, Cairo",
    "trackingNumber": null,
    "transactionId": null,
    "notes": null,
    "date": "2026-06-07T..."
  }
}
```

---

### `PATCH /admin/orders/:id/status`
**Validation:** orderStatus must be valid enum value
**Request:**
```json
{ "orderStatus": "Confirmed" }
```
**Valid Values:**
```
New Order → Contacted → Confirmed → Packed → Shipped → Out For Delivery → Delivered
                                                                         ↘ Cancelled
                                                                         ↘ Returned
```
> ⚠️ Terminal states: `Delivered`, `Cancelled`, `Returned` — لا يمكن التغيير منهم
> ✅ Auto-updates `shippingStatus`: Shipped/Out For Delivery → "In Transit", Delivered → "Delivered"
> ✅ لو status → Cancelled بيـfire `order_cancelled` notification

**Error (400):**
```json
{
  "success": false,
  "error": "Cannot transition from \"Delivered\" to \"New Order\"",
  "code": "INVALID_STATUS_TRANSITION"
}
```

---

### `PATCH /admin/orders/:id/payment-status`
**Validation:** paymentStatus must be valid enum value
**Request:**
```json
{ "paymentStatus": "Paid" }
```
**Valid Values:** `Paid` | `Pending` | `Failed` | `Refunded`

---

### `PATCH /admin/orders/:id/tracking`
**Validation:** trackingNumber required
**Request:**
```json
{ "trackingNumber": "EGX123456789" }
```

---

### `PATCH /admin/orders/:id/notes`
**Validation:** notes field required (can be empty string)
**Request:**
```json
{ "notes": "Customer requested gift wrapping." }
```

---

### `GET /admin/orders/export`
**Query Params:** نفس فلاتر الـ list
**Response:** CSV file download
```
Content-Type: text/csv
Content-Disposition: attachment; filename="orders-2026-06-07.csv"
```
**CSV Columns:** Order ID, Customer Name, Customer Email, Customer Phone, Total, Order Status, Payment Status, Shipping Status, Governorate, City, Address, Tracking Number, Notes, Date

---

## 9. Admin — Customers

### `GET /admin/customers`
**Query Params:**
| Param | Type | مثال |
|---|---|---|
| `search` | string | `ahmed` |
| `status` | string | `Active` |
| `sortBy` | string | `totalSpent` |
| `sortDir` | string | `desc` |
| `page` | number | `1` |
| `limit` | number | `10` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6a24d149...",
      "name": "Ahmed Mohamed",
      "email": "ahmed@example.com",
      "phone": "01012345678",
      "totalSpent": 610,
      "totalOrders": 2,
      "lastPurchase": "2026-06-07T...",
      "joinedDate": "2026-06-07T...",
      "status": "Active"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 },
  "aggregates": {
    "totalRevenue": 610,
    "totalOrders": 2,
    "avgOrderValue": 305
  }
}
```

---

### `PATCH /admin/customers/:id/status`
**Validation:** status must be "Active" or "Inactive"
**Request:**
```json
{ "status": "Inactive" }
```

---

### `GET /admin/customers/export`
**Response:** CSV file download

---

## 10. Admin — Inventory

### `GET /admin/inventory`
**Query Params:**
| Param | Type | مثال |
|---|---|---|
| `search` | string | `air force` |
| `status` | string | `Low Stock` |
| `sortBy` | string | `stock` |
| `sortDir` | string | `asc` |
| `page` | number | `1` |
| `limit` | number | `10` |

**Status Filter Values:** `In Stock` | `Low Stock` | `Out of Stock`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6a2568ff...",
      "name": "Air Force Classic White",
      "category": "Lifestyle",
      "sku": "LIF-AIRF-1234",
      "price": 120,
      "images": ["https://..."],
      "stock": 20,
      "movement": 4,
      "inventoryValue": 2400,
      "status": "In Stock"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 },
  "aggregates": {
    "totalUnits": 20,
    "lowStockCount": 0,
    "outOfStockCount": 0,
    "totalInventoryValue": 2400,
    "totalSKUs": 1
  }
}
```
> `movement` = units sold in last 7 days (محسوب من الـ orders الفعلية)

**Stock Status Thresholds:**
```
stock === 0         →  "Out of Stock"
stock > 0 && < 10  →  "Low Stock"
stock >= 10         →  "In Stock"
```

> ⭐ **v1.1 Performance:** الـ inventory endpoint دلوقتي بيعمل 4 parallel DB queries بدل N+1 queries. الـ movement بيتحسب بـ single aggregate لكل الـ products مرة واحدة.

---

### `GET /admin/inventory` — DB Indexes
```javascript
notificationSchema.index({ read: 1, createdAt: -1 }); // GET /admin/notifications
notificationSchema.index({ type: 1, createdAt: -1 }); // notifyLowStock spam check
```

---

### `PATCH /admin/inventory/:id/stock`
> `:id` = MongoDB `_id` بتاع الـ product

**Validation:** stock min 0 required
**Request:**
```json
{ "stock": 25 }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6a2568ff...",
    "name": "Air Force Classic White",
    "stock": 25,
    "status": "In Stock"
  }
}
```

---

## 11. Admin — Analytics

### `GET /admin/analytics`
**Query Params:** `?range=30` — Values: `7` | `30` | `90`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 610,
      "totalOrders": 2,
      "totalCustomers": 1,
      "avgOrderValue": 305,
      "revenueChange": 0,
      "ordersChange": 0,
      "customersChange": 0,
      "avgOrderValueChange": 0
    },
    "revenueChart": [
      { "date": "Jun 07", "revenue": 610, "orders": 2 }
    ],
    "categoryBreakdown": [
      { "name": "Lifestyle", "value": 100, "color": "#dc143c" }
    ],
    "topProducts": [
      {
        "productId": "6a2568ff...",
        "name": "Air Force Classic White",
        "sales": 4,
        "revenue": 480
      }
    ]
  }
}
```
> `xChange` = نسبة التغيير مقارنة بالفترة السابقة (%) — محسوبة فعلياً مش hardcoded

---

### `GET /admin/analytics/export`
**Query Params:** `?range=30`
**Response:** CSV file download

---

## 12. Admin — Shipping

### `GET /admin/shipping/active`
**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "awaitingShipment": 0,
      "inTransit": 0,
      "delivered": 0,
      "failedDeliveries": 0
    },
    "activeShipments": [
      {
        "id": "ORD-2026-001",
        "customerName": "Ahmed Mohamed",
        "shippingAddress": "123 El-Nasr St, Nasr City, Cairo",
        "orderStatus": "Shipped",
        "shippingStatus": "In Transit",
        "trackingNumber": "EGX123456789",
        "date": "2026-06-07T..."
      }
    ]
  }
}
```
> `activeShipments` بيجيب orders بـ status: `Packed` | `Shipped` | `Out For Delivery`
> `awaitingShipment` = orders بـ status `Confirmed`
> `inTransit` = orders بـ status `Shipped` أو `Out For Delivery`

---

## 13. Admin — Notifications

### `GET /admin/notifications`
**Query Params:**
| Param | Type | مثال |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `20` |
| `unreadOnly` | boolean | `true` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a256c42...",
      "type": "new_order",
      "title": "New Order Received",
      "message": "Order ORD-2026-001 placed by Ahmed Mohamed",
      "link": "/admin/orders/ORD-2026-001",
      "read": false,
      "createdAt": "2026-06-07T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1,
    "unreadCount": 2
  }
}
```

**Notification Types:**
| Type | متى يُنشأ | ملاحظة |
|---|---|---|
| `new_order` | عند تسجيل طلب جديد | fire and forget |
| `low_stock` | عندما يقل الـ stock عن 10 | مرة واحدة كل 24 ساعة لنفس المنتج |
| `new_review` | عند إضافة review جديد | — |
| `new_customer` | عند تسجيل user جديد (عادي أو Google) | — |
| `order_cancelled` | عند تغيير status لـ Cancelled | — |

---

### `PATCH /admin/notifications/:id/read`
**Request:** لا يحتاج body
**Response:**
```json
{ "success": true, "message": "Notification marked as read" }
```

---

### `PATCH /admin/notifications/read-all`
**Request:** لا يحتاج body
**Response:**
```json
{ "success": true, "data": { "updatedCount": 3 } }
```

---

## 14. Admin — Feedback

### `GET /admin/feedback`
**Query Params:** `?page=1&limit=20`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a256c42...",
      "orderId": "ORD-2026-001",
      "customerName": "Ahmed Mohamed",
      "feedback": "Great shopping experience!",
      "createdAt": "2026-06-07T..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```
> الـ feedback بيتحفظ تلقائياً من الـ checkout لو الـ `feedback` field مش فاضي

---

## 15. Admin — Settings

### `GET /admin/settings`
**Response:**
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
      "taxId": "",
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
      "stripeEnabled": false,
      "stripeKeyMasked": null,
      "paypalEnabled": false,
      "paypalClientIdMasked": null,
      "cashOnDelivery": true,
      "testMode": true
    },
    "shipping": {
      "freeShippingThreshold": 500,
      "processingDays": 1,
      "locations": [
        { "id": "6a24d149...", "city": "Cairo", "rate": 65, "deliveryDays": "1-2 Days", "isCustom": false }
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
> ⚠️ الـ `stripeKey` و `paypalClientId` الحقيقيين لا يُرجعان أبداً — masked فقط

---

### `PUT /admin/settings/store`
**Validation:** currency enum (USD/EUR/GBP/EGP/AED/SAR), language enum
**Request:** Full or partial `store` object

---

### `PUT /admin/settings/payment`
**Request:**
```json
{
  "stripeEnabled": true,
  "stripeKey": "sk_test_...",
  "cashOnDelivery": true,
  "testMode": false
}
```

---

### `PUT /admin/settings/shipping`
**Request:**
```json
{
  "freeShippingThreshold": 500,
  "processingDays": 1,
  "locations": [
    { "id": "6a24d149...", "rate": 70, "deliveryDays": "1-2 Days" }
  ]
}
```
> ⚠️ `isCustom: false` → يمكن تغيير `rate` و `deliveryDays` فقط، الـ `city` ثابت

---

### `PUT /admin/settings/notifications`
**Request:**
```json
{
  "newOrder": true,
  "lowStock": true,
  "emailRecipient": "contact@shoex.com"
}
```

---

### `POST /admin/settings/security/change-password`
**Validation:** currentPassword required, newPassword min 6, confirmNewPassword must match
**Request:**
```json
{
  "currentPassword": "Admin@123456",
  "newPassword": "NewPass@789",
  "confirmNewPassword": "NewPass@789"
}
```

---

### `PUT /admin/settings/security/2fa`
**Validation:** enabled (boolean) required
**Request:**
```json
{ "enabled": true }
```

---

### `PUT /admin/settings/security/session-timeout`
**Validation:** timeoutMinutes min 5 / max 1440
**Request:**
```json
{ "timeoutMinutes": 30 }
```

---

## 16. Admin — Team
> ⚠️ كل الـ endpoints دي تحتاج `role: "owner"` — غيره يرجع 403

### `GET /admin/team`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6a24d149...",
      "name": "Store Owner",
      "email": "boodymns@gmail.com",
      "role": "owner",
      "createdAt": "2026-06-07T..."
    }
  ]
}
```

---

### `POST /admin/team`
**Validation:** name min 2, valid email, password min 6, role must be "admin"/"editor"/"viewer"
**Request:**
```json
{
  "name": "Content Editor",
  "email": "editor@shoex.com",
  "password": "TempPass@123",
  "role": "editor"
}
```
**Response (201):** New user object (بدون password)
> ✅ Backend بيبعت onboarding email للـ member الجديد تلقائياً

**Allowed Roles for Team:** `admin` | `editor` | `viewer`

---

### `PUT /admin/team/:id`
**Validation:** name/email/role optional, role enum
**Request:**
```json
{
  "name": "Senior Editor",
  "email": "editor@shoex.com",
  "role": "admin"
}
```

---

### `DELETE /admin/team/:id`
**Response:**
```json
{ "success": true, "message": "Team member deleted successfully" }
```
**Rules:**
- ❌ لا يمكن حذف الـ owner
- ❌ لازم يفضل admin واحد على الأقل

---

## 📊 Status Strings — مهم جداً

> الـ Frontend بيعمل exact string matching — أي فرق بيكسر الـ UI

| ✅ الصح | ❌ الغلط |
|---|---|
| `"New Order"` | `"new_order"` |
| `"Out For Delivery"` | `"out_for_delivery"` |
| `"In Stock"` | `"in_stock"` |
| `"Low Stock"` | `"low_stock"` |
| `"Out of Stock"` | `"out_of_stock"` |
| `"In Transit"` | `"in_transit"` |

## 📦 Order Status Flow

```
New Order → Contacted → Confirmed → Packed → Shipped → Out For Delivery → Delivered
                                                                         ↘ Cancelled
                                                                         ↘ Returned
```

## 🚀 Performance Notes (v1.1)

| Endpoint | التحسين |
|---|---|
| `GET /admin/inventory` | 4 parallel queries بدل N+1 (N = عدد الـ products في الصفحة) |
| `GET /admin/orders` | `statusCounts` + `orders` + `total` بيتجيبوا في `Promise.all` واحد |

## 🔢 Total Endpoints: 65

| Section | Count |
|---|---|
| Auth | 8 |
| Public Products & Reviews | 5 |
| Public Orders | 1 |
| Public Shipping & Promo | 3 |
| User Account | 7 |
| Admin Dashboard | 3 |
| Admin Products | 8 |
| Admin Orders | 7 |
| Admin Customers | 3 |
| Admin Inventory | 2 |
| Admin Analytics | 2 |
| Admin Shipping | 1 |
| Admin Notifications | 3 |
| Admin Feedback | 1 |
| Admin Settings | 8 |
| Admin Team | 4 |
| **Total** | **65** |

---

## 📝 Changelog

### v1.2 (June 2026)
- 🔧 **Fix:** `notifyLowStock` — أضفنا 24-hour spam check قبل إنشاء notification لنفس المنتج
- 🔧 **Fix:** `order.controller.js` — `sendWhatsAppConfirmation` + `notifyNewOrder` + `notifyLowStock` بقوا fire and forget بـ `.catch()` — الـ order بيرجع response فوراً بغض النظر عنهم
- 🔧 **Fix:** `Notification.model.js` — أضفنا index على `{ type, createdAt }` للـ spam check query
- 📋 **Env:** `OWNER_PASSWORD` و `GOOGLE_CLIENT_ID` محتاجين يتضافوا للـ `.env`

### v1.1 (June 2026)
- ⭐ **New:** `POST /auth/google` — Google OAuth
- ⭐ **New:** `GET /products/:id/reviews` + `POST /products/:id/reviews` — Reviews system
- ⭐ **New:** Section 5 — User Account endpoints (orders, wishlist, address)
- ⭐ **New:** `statusCounts` field في `GET /admin/orders` response
- ⭐ **New:** `POST /newsletter/subscribe` موثق مع validation
- 🔧 **Fix:** `GET /admin/inventory` — N+1 queries → 4 parallel queries
- 🔧 **Fix:** `GET /admin/orders/export` — CSV escaping + empty orders guard
- 🔧 **Fix:** `POST /auth/logout` — بيـclear الـ refreshToken من الـ DB
- 🔧 **Fix:** `POST /auth/refresh` — بيـrotate الـ refreshToken
- 🔒 **Validation:** Joi validation مضافة على كل الـ endpoints
- 📋 **Docs:** `GOOGLE_CLIENT_ID` مضافة لـ .env requirements

---

*SHOEX API Reference — Version 1.2 — June 2026*