import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    unit: { type: String, default: "gram" },
    sku: { type: String, default: "", trim: true },
    metalType: {
      type: String,
      enum: ["gold", "silver", "platinum", "diamond", "imitation", "other"],
      default: "gold",
    },
    inventoryWeight: { type: Number, default: 0, min: 0 },
    purity: { type: String, default: "22K" },
    fineness: { type: String, default: "916" },
    huid: { type: String, default: "", trim: true, uppercase: true },
    hallmarked: { type: Boolean, default: false },
    grossWeight: { type: Number, default: 0 },
    netWeight: { type: Number, default: 0 },
    stoneWeight: { type: Number, default: 0 },
    pieces: { type: Number, default: 1 },
    metalRatePerGram: { type: Number, default: 0 },
    wastagePercent: { type: Number, default: 0 },
    makingChargeType: { type: String, enum: ["per_gram", "percent", "fixed"], default: "per_gram" },
    makingCharge: { type: Number, default: 0 },
    stoneValue: { type: Number, default: 0 },
    stoneValueType: {
      type: String,
      enum: ["per_piece", "per_gram"],
      default: "per_piece",
    },

    hsnCode: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    purchasePrice: {
      type: Number,
      default: 0,
    },

    creditRate: { type: Number, default: 0 },

    cashRate: {
      type: Number,
      default: 0,
    },

    wholesaleRate: {
      type: Number,
      default: 0,
    },

    gstRate: {
      type: Number,
      default: 3,
    },

    expiryDate: {
      type: Date,
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
    },

    status: {
      type: String,
      enum: ["available", "out_of_stock"],
      default: "available",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
