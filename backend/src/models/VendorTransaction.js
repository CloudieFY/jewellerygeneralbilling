import mongoose from "mongoose";

const vendorTransactionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    type: {
      type: String,
      enum: ["opening", "purchase", "payment", "expense"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    voucherNo: {
      type: String,
      default: "",
      trim: true,
    },

    billNo: {
      type: String,
      default: "",
      trim: true,
    },

    partyName: {
      type: String,
      default: "",
      trim: true,
    },

    expenseHead: {
      type: String,
      default: "",
      trim: true,
    },

    voucherDate: {
      type: Date,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank", "cheque"],
    },

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const VendorTransaction = mongoose.model(
  "VendorTransaction",
  vendorTransactionSchema
);

export default VendorTransaction;
