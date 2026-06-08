const mongoose = require("mongoose");

const sizeStockSchema = new mongoose.Schema(
  {
    size: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      default: "SHOEX",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Lifestyle", "Running", "Basketball", "Casual", "Training"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one image is required",
      },
    },
    backgroundImageIndex: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sizeStocks: {
      type: [sizeStockSchema],
      default: [],
    },
    sizes: {
      type: [Number],
      default: [],
    },
    colors: {
      type: [colorSchema],
      default: [],
    },
    sku: {
      type: String,
      trim: true,
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual — inStock مش بنخزنه في الـ DB
productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);