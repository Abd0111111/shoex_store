// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import RootLayout from "./RootLayout";

// ── Public pages ──────────────────────────────────────
import Home           from "@/pages/Home";
import Shop           from "@/pages/Shop";
import ProductDetails from "@/pages/ProductDetails";
import Cart           from "@/pages/Cart";
import Checkout       from "@/pages/Checkout";
import Login          from "@/pages/Login";
import Register       from "@/pages/Register";
import Account        from "@/pages/Account";

// ── Admin layout ──────────────────────────────────────
import AdminLayout from "@/components/layout/AdminLayout";

// ── Admin pages ───────────────────────────────────────
import AdminDashboard   from "@/pages/admin/AdminDashboard";
import AdminProducts    from "@/pages/admin/AdminProducts";
import AdminOrders      from "@/pages/admin/AdminOrders";
import AdminOrderDetail from "@/pages/admin/AdminOrderDetail";
import AdminAnalytics   from "@/pages/admin/AdminAnalytics";
import AdminCustomers   from "@/pages/admin/AdminCustomers";
import AdminInventory   from "@/pages/admin/AdminInventory";
import AdminShipping    from "@/pages/admin/AdminShipping";
import AdminSettings    from "@/pages/admin/AdminSettings";
import AddProduct       from "@/pages/admin/AddProduct";
import EditProduct      from "@/pages/admin/EditProduct"; // ← NEW
import AdminPromos      from "@/pages/admin/AdminPromos";

export const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true,              element: <Home /> },
      { path: "shop",             element: <Shop /> },
      { path: "product/:id",      element: <ProductDetails /> },
      { path: "cart",             element: <Cart /> },
      { path: "checkout",         element: <Checkout /> },
      { path: "account",          element: <Account /> },
      { path: "login",            element: <Login /> },
      { path: "register",         element: <Register /> },
    ],
  },

  // ── Admin ────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                          element: <AdminDashboard /> },
      { path: "products",                     element: <AdminProducts /> },
      { path: "products/add",                 element: <AddProduct /> },
      { path: "products/edit/:id",            element: <EditProduct /> }, // ← NEW
      { path: "orders",                       element: <AdminOrders /> },
      { path: "orders/:id",                   element: <AdminOrderDetail /> },
      { path: "analytics",                    element: <AdminAnalytics /> },
      { path: "customers",                    element: <AdminCustomers /> },
      { path: "inventory",                    element: <AdminInventory /> },
      { path: "shipping",                     element: <AdminShipping /> },
      { path: "settings",                     element: <AdminSettings /> },
      { path: "promos",                       element: <AdminPromos /> },
    ],
  },
]);