const Notification = require("../models/Notification.model");
const nodemailer = require("nodemailer");

// ── Email transporter ────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ── Send new order email to admin ────────────────────────────────────────────
const sendNewOrderEmail = async (order) => {
  try {
    const transporter = createTransporter();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠️  ADMIN_EMAIL not set — skipping order email");
      return;
    }

    const productRows = order.products
      .map(
        (p) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px">${p.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${p.size}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${p.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right">${(p.price * p.quantity).toFixed(2)} EGP</td>
        </tr>`
      )
      .join("");

    const adminUrl = `${process.env.FRONTEND_URL}/admin/orders/${order.orderId}`;

    await transporter.sendMail({
      from: `"SHOEX Store" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🛒 New Order — ${order.orderId} | ${order.customer.name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
          <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

            <!-- Header -->
            <div style="background:#dc143c;padding:28px 32px;display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px">SHOEX</span>
              <span style="background:rgba(255,255,255,0.15);color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px">New Order</span>
            </div>

            <!-- Body -->
            <div style="padding:32px">
              <h2 style="margin:0 0 4px;font-size:22px;color:#111">New Order Received 🎉</h2>
              <p style="margin:0 0 24px;color:#888;font-size:14px">
                ${new Date(order.createdAt || Date.now()).toLocaleString("en-EG")}
              </p>

              <!-- Order ID -->
              <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <span style="color:#888;font-size:13px">Order ID</span>
                  <span style="font-weight:700;font-size:13px;color:#dc143c">${order.orderId}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <span style="color:#888;font-size:13px">Customer</span>
                  <span style="font-weight:600;font-size:13px">${order.customer.name}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <span style="color:#888;font-size:13px">Phone</span>
                  <span style="font-weight:600;font-size:13px">${order.customer.phone}</span>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#888;font-size:13px">Address</span>
                  <span style="font-weight:600;font-size:13px;text-align:right;max-width:60%">
                    ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.governorate}
                  </span>
                </div>
              </div>

              <!-- Products table -->
              <h3 style="font-size:14px;font-weight:700;color:#333;margin:0 0 8px;border-left:3px solid #dc143c;padding-left:10px">Order Items</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <thead>
                  <tr style="background:#f3f3f3">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#555;font-weight:700">Product</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#555;font-weight:700">Size</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#555;font-weight:700">Qty</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#555;font-weight:700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>

              <!-- Totals -->
              <div style="border-top:2px solid #f0f0f0;padding-top:16px;margin-bottom:28px">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span style="color:#888;font-size:13px">Subtotal</span>
                  <span style="font-size:13px">${order.subtotal.toFixed(2)} EGP</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span style="color:#888;font-size:13px">Shipping</span>
                  <span style="font-size:13px">${order.shippingCost.toFixed(2)} EGP</span>
                </div>
                ${
                  order.discount
                    ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px">
                        <span style="color:#888;font-size:13px">Discount</span>
                        <span style="font-size:13px;color:green">-${order.discount.toFixed(2)} EGP</span>
                       </div>`
                    : ""
                }
                <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid #eee">
                  <span style="font-weight:700;font-size:15px">Total</span>
                  <span style="font-weight:900;font-size:18px;color:#dc143c">${order.total.toFixed(2)} EGP</span>
                </div>
              </div>

              <!-- CTA -->
              <a href="${adminUrl}"
                 style="display:block;text-align:center;background:#dc143c;color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:10px;text-decoration:none">
                View Order in Dashboard →
              </a>
            </div>

            <!-- Footer -->
            <div style="background:#f9f9f9;padding:16px 32px;text-align:center;color:#aaa;font-size:11px;border-top:1px solid #eee">
              SHOEX Admin Panel &bull; This is an automated notification
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ New order email sent to ${adminEmail} — ${order.orderId}`);
  } catch (error) {
    console.error("❌ New order email failed:", error.message);
    // لا نرمي error — الـ email مش blocking
  }
};

// ── DB Notification helper ────────────────────────────────────────────────────
const createNotification = async ({ type, title, message, link }) => {
  try {
    await Notification.create({ type, title, message, link });
  } catch (error) {
    console.error("❌ Notification creation error:", error.message);
  }
};

// ── notifyNewOrder — DB + Email ───────────────────────────────────────────────
const notifyNewOrder = async (order) => {
  // 1. DB notification (للـ admin panel)
  await createNotification({
    type: "new_order",
    title: "New Order Received",
    message: `Order ${order.orderId} placed by ${order.customer.name}`,
    link: `/admin/orders/${order.orderId}`,
  });

  // 2. Email notification (للـ Gmail)
  sendNewOrderEmail(order).catch((err) =>
    console.error("New order email failed:", err.message)
  );
};

// ── notifyLowStock ────────────────────────────────────────────────────────────
const notifyLowStock = async (product) => {
  try {
    const recent = await Notification.findOne({
      type: "low_stock",
      message: { $regex: product.name, $options: "i" },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recent) return;

    await createNotification({
      type: "low_stock",
      title: "Low Stock Alert",
      message: `${product.name} has only ${product.stock} units left`,
      link: `/admin/inventory`,
    });
  } catch (error) {
    console.error("❌ Low stock notification error:", error.message);
  }
};

// ── notifyNewCustomer ─────────────────────────────────────────────────────────
const notifyNewCustomer = async (user) => {
  await createNotification({
    type: "new_customer",
    title: "New Customer Registered",
    message: `${user.name} just created an account`,
    link: `/admin/customers`,
  });
};

// ── notifyNewReview ───────────────────────────────────────────────────────────
const notifyNewReview = async (product, userName) => {
  await createNotification({
    type: "new_review",
    title: "New Review Submitted",
    message: `${userName} reviewed ${product.name}`,
    link: `/admin/products`,
  });
};

// ── notifyOrderCancelled ──────────────────────────────────────────────────────
const notifyOrderCancelled = async (order) => {
  await createNotification({
    type: "order_cancelled",
    title: "Order Cancelled",
    message: `Order ${order.orderId} was cancelled by ${order.customer.name}`,
    link: `/admin/orders/${order.orderId}`,
  });
};

module.exports = {
  notifyNewOrder,
  notifyLowStock,
  notifyNewCustomer,
  notifyNewReview,
  notifyOrderCancelled,
};