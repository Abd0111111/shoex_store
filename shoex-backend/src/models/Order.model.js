const mongoose = require("mongoose");

const orderProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: Number, required: true },
    color: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    customer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      altPhone: { type: String, default: null },
    },
    shippingAddress: {
      country: { type: String, default: "Egypt" },
      governorate: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      apartment: { type: String, default: null },
    },
    products: {
      type: [orderProductSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must have at least one product",
      },
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: null },
    total: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: [
        "New Order",
        "Contacted",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "New Order",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed", "Refunded"],
      default: "Pending",
    },
    shippingStatus: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered", "Failed"],
      default: "Pending",
    },
    trackingNumber: { type: String, default: null },
    transactionId: { type: String, default: null },
    notes: { type: String, default: null },
    estimatedDelivery: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Auto-generate orderId before save
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Order").countDocuments();
    this.orderId = `ORD-${year}-${String(count + 1).padStart(3, "0")}`;
  }
  next();
});

// Indexes
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customer.email": 1 });

module.exports = mongoose.model("Order", orderSchema);