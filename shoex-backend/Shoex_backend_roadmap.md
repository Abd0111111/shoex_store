# SHOEX Backend — خطة البناء الكاملة 🚀

> **Stack:** Node.js + Express + MongoDB + Mongoose + JWT  
> **Image Upload:** Cloudinary (قابل للتغيير بسهولة)  
> **API Version:** `/api/v1/`  
> **تاريخ الخطة:** يونيو 2026

---

## 📁 Folder Structure الكامل

```
shoex-backend/
│
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   ├── cloudinary.js          # Cloudinary setup (أو S3 بعدين)
│   │   ├── cors.js                # CORS config
│   │   └── env.js                 # env variables validation
│   │
│   ├── models/
│   │   ├── User.model.js          # users + admins في collection واحد
│   │   ├── Product.model.js       # products كامل مع sizeStocks
│   │   ├── Order.model.js         # orders مع embedded products
│   │   ├── Review.model.js        # reviews مرتبطة بـ product + user
│   │   ├── Notification.model.js  # admin notifications
│   │   ├── Feedback.model.js      # checkout feedback
│   │   ├── PromoCode.model.js     # promo codes
│   │   ├── ShippingZone.model.js  # 27 governorates + custom zones
│   │   └── Settings.model.js      # store settings (single document)
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js      # public storefront
│   │   ├── order.routes.js        # public checkout
│   │   ├── user.routes.js         # /users/me/*
│   │   ├── promo.routes.js
│   │   ├── newsletter.routes.js
│   │   ├── shipping.routes.js     # public rates
│   │   └── admin/
│   │       ├── dashboard.routes.js
│   │       ├── products.routes.js
│   │       ├── orders.routes.js
│   │       ├── customers.routes.js
│   │       ├── inventory.routes.js
│   │       ├── analytics.routes.js
│   │       ├── shipping.routes.js
│   │       ├── settings.routes.js
│   │       ├── team.routes.js
│   │       ├── notifications.routes.js
│   │       └── feedback.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── user.controller.js
│   │   ├── promo.controller.js
│   │   └── admin/
│   │       ├── dashboard.controller.js
│   │       ├── products.controller.js
│   │       ├── orders.controller.js
│   │       ├── customers.controller.js
│   │       ├── inventory.controller.js
│   │       ├── analytics.controller.js
│   │       ├── shipping.controller.js
│   │       ├── settings.controller.js
│   │       ├── team.controller.js
│   │       ├── notifications.controller.js
│   │       └── feedback.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      # verifyToken
│   │   ├── admin.middleware.js     # requireAdmin, requireOwner
│   │   ├── error.middleware.js     # global error handler
│   │   ├── validate.middleware.js  # Joi request validation
│   │   └── upload.middleware.js    # multer config
│   │
│   ├── services/
│   │   ├── auth.service.js         # JWT sign/verify/refresh logic
│   │   ├── email.service.js        # nodemailer (welcome, reset pw, onboarding)
│   │   ├── whatsapp.service.js     # WhatsApp Business API
│   │   ├── upload.service.js       # Cloudinary / S3 abstraction layer
│   │   ├── notification.service.js # auto-create notifications
│   │   └── analytics.service.js    # aggregation queries
│   │
│   ├── utils/
│   │   ├── response.js             # sendSuccess(), sendError() helpers
│   │   ├── pagination.js           # buildPaginationMeta()
│   │   ├── orderStatus.js          # status transition validation
│   │   ├── stockStatus.js          # "In Stock" / "Low Stock" / "Out of Stock"
│   │   └── csvExport.js            # orders/customers/analytics CSV
│   │
│   ├── validations/
│   │   ├── auth.validation.js
│   │   ├── product.validation.js
│   │   ├── order.validation.js
│   │   └── admin.validation.js
│   │
│   ├── seeds/
│   │   ├── shippingZones.seed.js   # 27 governorates initial data
│   │   └── adminUser.seed.js       # owner account initial seed
│   │
│   └── app.js                      # Express app setup
│
├── server.js                       # Entry point
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## 📦 Packages المطلوبة

```json
{
  "dependencies": {
    "express": "^4.18",
    "mongoose": "^8",
    "jsonwebtoken": "^9",
    "bcryptjs": "^2.4",
    "dotenv": "^16",
    "cors": "^2.8",
    "multer": "^1.4",
    "cloudinary": "^2",
    "nodemailer": "^6",
    "joi": "^17",
    "json2csv": "^6",
    "express-rate-limit": "^7",
    "helmet": "^7",
    "morgan": "^1.10"
  },
  "devDependencies": {
    "nodemon": "^3"
  }
}
```

---

## 🗺️ مراحل البناء

---

### ✅ المرحلة الأولى — الأساس

> **الهدف:** الـ app يشتغل ويقدر تعمل login وتشوف products

| # | المهمة | الملفات المطلوبة | الحالة |
|---|---|---|---|
| 1 | Project setup + تثبيت الـ packages | `package.json`, `server.js`, `app.js` | ⬜ |
| 2 | MongoDB connection | `config/db.js` | ⬜ |
| 3 | Response helpers | `utils/response.js` | ⬜ |
| 4 | Global error middleware | `middleware/error.middleware.js` | ⬜ |
| 5 | User model | `models/User.model.js` | ⬜ |
| 6 | Auth endpoints كاملين | login, register, logout, /me, refresh, forgot/reset password | ⬜ |
| 7 | Auth + Admin middleware | `middleware/auth.middleware.js`, `middleware/admin.middleware.js` | ⬜ |
| 8 | Shipping zones seed | `seeds/shippingZones.seed.js` | ⬜ |
| 9 | Admin user seed | `seeds/adminUser.seed.js` | ⬜ |

**Auth Endpoints المطلوبة في المرحلة دي:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

---

### ✅ المرحلة الثانية — Products + Orders (الجوهر)

> **الهدف:** الـ storefront يشتغل كامل — الـ user يقدر يتصفح ويطلب

| # | المهمة | الملفات المطلوبة | الحالة |
|---|---|---|---|
| 10 | Product model | `models/Product.model.js` | ⬜ |
| 11 | Public product endpoints | `controllers/product.controller.js` | ⬜ |
| 12 | Image upload setup | `middleware/upload.middleware.js`, `services/upload.service.js` | ⬜ |
| 13 | Admin product CRUD | `controllers/admin/products.controller.js` | ⬜ |
| 14 | Admin product patches | discount, remove discount, stock update | ⬜ |
| 15 | PromoCode model + validate endpoint | `models/PromoCode.model.js` | ⬜ |
| 16 | ShippingZone model + public rates | `models/ShippingZone.model.js` | ⬜ |
| 17 | Order model | `models/Order.model.js` | ⬜ |
| 18 | Checkout endpoint | `POST /api/v1/orders` | ⬜ |
| 19 | WhatsApp service | `services/whatsapp.service.js` | ⬜ |
| 20 | Feedback model + save on checkout | `models/Feedback.model.js` | ⬜ |

**Product Endpoints:**
```
GET    /api/v1/products                    # public list
GET    /api/v1/products/categories         # categories with count
GET    /api/v1/products/:id                # single product
POST   /api/v1/admin/products              # create
PUT    /api/v1/admin/products/:id          # update
DELETE /api/v1/admin/products/:id          # delete
PATCH  /api/v1/admin/products/:id/stock
PATCH  /api/v1/admin/products/:id/discount
PATCH  /api/v1/admin/products/:id/discount/remove
POST   /api/v1/admin/products/upload-image
```

**Order Endpoints:**
```
POST   /api/v1/orders                      # checkout
GET    /api/v1/shipping/rates              # public rates
POST   /api/v1/promo/validate
```

---

### ✅ المرحلة الثالثة — Admin Core

> **الهدف:** الـ admin dashboard يشتغل بدون mock data

| # | المهمة | الملفات المطلوبة | الحالة |
|---|---|---|---|
| 21 | Dashboard stats aggregation | `controllers/admin/dashboard.controller.js` | ⬜ |
| 22 | Recent orders + low stock alerts | dashboard endpoints | ⬜ |
| 23 | Admin orders management | list, patches (status, payment, tracking, notes) | ⬜ |
| 24 | Order status workflow validation | `utils/orderStatus.js` | ⬜ |
| 25 | Admin order detail | `GET /api/v1/admin/orders/:id` | ⬜ |
| 26 | Admin customers list + status patch | `controllers/admin/customers.controller.js` | ⬜ |
| 27 | Admin inventory list + stock patch | `controllers/admin/inventory.controller.js` | ⬜ |
| 28 | Admin shipping active view | `controllers/admin/shipping.controller.js` | ⬜ |
| 29 | CSV export (orders + customers) | `utils/csvExport.js` | ⬜ |

**Admin Order Endpoints:**
```
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/:id
PATCH  /api/v1/admin/orders/:id/status
PATCH  /api/v1/admin/orders/:id/payment-status
PATCH  /api/v1/admin/orders/:id/tracking
PATCH  /api/v1/admin/orders/:id/notes
GET    /api/v1/admin/orders/export
```

**Order Status Workflow (enforce هذا الترتيب بالظبط):**
```
New Order → Contacted → Confirmed → Packed → Shipped → Out For Delivery → Delivered
                                                                        ↘ Cancelled
                                                                        ↘ Returned
```
> Terminal states: `Delivered`, `Cancelled`, `Returned` — لا رجوع منهم

---

### ✅ المرحلة الرابعة — Settings + Team + Notifications

| # | المهمة | الملفات المطلوبة | الحالة |
|---|---|---|---|
| 30 | Settings model + GET/PUT | `models/Settings.model.js` | ⬜ |
| 31 | Settings sections كاملة | store, payment, shipping, notifications, security | ⬜ |
| 32 | Team management (owner only) | `controllers/admin/team.controller.js` | ⬜ |
| 33 | Email service | `services/email.service.js` | ⬜ |
| 34 | Notification model + auto-triggers | `models/Notification.model.js`, `services/notification.service.js` | ⬜ |
| 35 | Notification endpoints | GET, PATCH read, PATCH read-all | ⬜ |

**Settings Endpoints:**
```
GET    /api/v1/admin/settings
PUT    /api/v1/admin/settings/store
PUT    /api/v1/admin/settings/payment
PUT    /api/v1/admin/settings/shipping
PUT    /api/v1/admin/settings/notifications
POST   /api/v1/admin/settings/security/change-password
PUT    /api/v1/admin/settings/security/2fa
PUT    /api/v1/admin/settings/security/session-timeout
```

**Team Endpoints (owner only):**
```
GET    /api/v1/admin/team
POST   /api/v1/admin/team
PUT    /api/v1/admin/team/:id
DELETE /api/v1/admin/team/:id
```

**Notification Auto-Triggers:**
```
new order placed          →  type: "new_order"
stock drops below 10      →  type: "low_stock"
new review submitted      →  type: "new_review"
new user registers        →  type: "new_customer"
order cancelled           →  type: "order_cancelled"
```

---

### ✅ المرحلة الخامسة — Analytics + Reviews + Polish

| # | المهمة | الملفات المطلوبة | الحالة |
|---|---|---|---|
| 36 | Analytics aggregations | `services/analytics.service.js` | ⬜ |
| 37 | Analytics endpoint + CSV export | `controllers/admin/analytics.controller.js` | ⬜ |
| 38 | Review model + endpoints | `models/Review.model.js` | ⬜ |
| 39 | User account endpoints | orders, wishlist, address | ⬜ |
| 40 | Newsletter subscribe | `routes/newsletter.routes.js` | ⬜ |
| 41 | Google OAuth | `POST /api/v1/auth/google` | ⬜ |
| 42 | 2FA setup | security settings | ⬜ |
| 43 | Joi validation layer كاملة | `validations/` folder | ⬜ |

**Analytics Endpoints:**
```
GET    /api/v1/admin/analytics?range=30
GET    /api/v1/admin/analytics/export?range=30
```

**Review Endpoints:**
```
GET    /api/v1/products/:id/reviews
POST   /api/v1/products/:id/reviews     # requires auth + delivered order
```

**User Account Endpoints:**
```
GET    /api/v1/users/me/orders
GET    /api/v1/users/me/wishlist
POST   /api/v1/users/me/wishlist
DELETE /api/v1/users/me/wishlist/:productId
GET    /api/v1/users/me/address
PUT    /api/v1/users/me/address
DELETE /api/v1/users/me/address
```

---

## ⚙️ ملاحظات تقنية مهمة

### MongoDB-specific decisions

| القرار | التفاصيل |
|---|---|
| `sizeStocks` و `colors` | embedded arrays في الـ Product document — مش collections منفصلة |
| `Settings` | single document في collection — مش row لكل setting |
| `inStock` | **لا تخزنه في الـ DB** — اعمله virtual field |
| Order status | enum في الـ Order schema + validation في `utils/orderStatus.js` |

```js
// inStock كـ virtual — مثال
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});
```

### Stock Status Thresholds (ثابتة في كل الـ app)

```
stock === 0          →  "Out of Stock"
stock > 0 && < 10   →  "Low Stock"
stock >= 10          →  "In Stock"
```

### Image Upload — Abstraction Layer

```
upload.service.js  →  بيستقبل file buffer
                   →  يرفعه على Cloudinary (أو S3 لو غيرت)
                   →  يرجع { url, key }
```
> بالشكل ده لو قررت تغير من Cloudinary لـ S3، هتغير في ملف واحد بس

### Response Format الموحد

```js
// utils/response.js
sendSuccess(res, data, message, statusCode = 200)
sendError(res, message, code, statusCode = 400)
sendPaginated(res, data, pagination)
```

### JWT Strategy

```
Access Token   →  expires: 7 days
Refresh Token  →  expires: 30 days
On 401         →  frontend calls POST /auth/refresh automatically
If refresh fails → logout() + redirect /login
```

---

## 🌍 .env.example

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/shoex

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

FRONTEND_URL=http://localhost:5173
OWNER_EMAIL=boodymns@gmail.com
```

---

## 🎯 Role-Based Access Control

| Role | الصلاحيات |
|---|---|
| `owner` | كل حاجة + team management — مينفعش يتحذف |
| `admin` | products + orders + settings — من غير team |
| `editor` | products + orders فقط — من غير settings |
| `viewer` | read-only: dashboard + analytics بس |

```js
// JWT Payload
{
  "sub": "usr_001",
  "email": "user@shoex.com",
  "role": "admin",       // "owner" | "admin" | "editor" | "viewer" | "user"
  "isOwner": false,
  "iat": 1717747200,
  "exp": 1718352000
}
```

---

## 📊 Status Strings — مهم جداً

> الـ frontend بيعمل exact string matching — أي فرق بيكسر الـ UI بصمت

| ✅ الصح | ❌ الغلط |
|---|---|
| `"New Order"` | `"new_order"` أو `"NEW_ORDER"` |
| `"Out For Delivery"` | `"out_for_delivery"` |
| `"In Stock"` | `"in_stock"` |
| `"Low Stock"` | `"low_stock"` |
| `"New Order"` → `"Contacted"` → ... | أي ترتيب تاني |

---

## 📋 Checklist سريع — ترتيب الأولويات

```
المرحلة 1 — الأساس
  ⬜ Project setup
  ⬜ MongoDB connection
  ⬜ Response utils
  ⬜ Error middleware
  ⬜ User model
  ⬜ Auth endpoints (7 endpoints)
  ⬜ Auth middleware
  ⬜ Seeds (shipping zones + admin user)

المرحلة 2 — Products + Orders
  ⬜ Product model
  ⬜ Public product endpoints
  ⬜ Image upload
  ⬜ Admin product CRUD + patches
  ⬜ PromoCode model + validate
  ⬜ ShippingZone model + public rates
  ⬜ Order model
  ⬜ Checkout endpoint
  ⬜ WhatsApp service
  ⬜ Feedback model

المرحلة 3 — Admin Core
  ⬜ Dashboard stats
  ⬜ Admin orders (list + patches + detail)
  ⬜ Order status workflow validation
  ⬜ Admin customers
  ⬜ Admin inventory
  ⬜ Admin shipping view
  ⬜ CSV exports

المرحلة 4 — Settings + Team + Notifications
  ⬜ Settings model + endpoints
  ⬜ Team management
  ⬜ Email service
  ⬜ Notification model + auto-triggers
  ⬜ Notification endpoints

المرحلة 5 — Analytics + Reviews + Polish
  ⬜ Analytics aggregations + export
  ⬜ Reviews model + endpoints
  ⬜ User account endpoints
  ⬜ Newsletter
  ⬜ Google OAuth
  ⬜ Joi validation layer كاملة
```

---

*SHOEX Backend Roadmap — Version 1.0*  
*بناءً على API Spec v1.1 — يونيو 2026*