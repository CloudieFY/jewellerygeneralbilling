import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
    customerName: { type: String, required: true, trim: true },
    customerMobile: { type: String, required: true, trim: true },
    customerAddress: { type: String, default: "", trim: true },
    itemDescription: { type: String, required: true, trim: true },
    metal: { type: String, required: true, trim: true },
    purity: { type: String, required: true, trim: true },
    fixedRate: { type: Number, default: null, min: 0 },
    advancePaid: { type: Number, default: 0, min: 0 },
    orderDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    note: { type: String, default: "", trim: true },
    design: {
      name: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      data: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "ready", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
