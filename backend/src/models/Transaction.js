import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    type: {
      type: String,
      enum: ["opening", "credit", "payment", "interest"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },

    invoiceNumber: {
      type: String,
      default: "",
    },

    voucherNo: {
      type: String,
      default: "",
      trim: true,
    },

    voucherDate: {
      type: Date,
    },

    description: {
      type: String,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank", "cheque"],
    },

    dueDate: {
      type: Date,
    },



    // ================= PRODUCTS =================

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        quantity: {
          type: Number,
        },

        price: {
          type: Number,
        },
      },
    ],



    // ================= INTEREST SYSTEM =================

    interestApplied: {
      type: Boolean,
      default: false,
    },

    interestMonth: {
      type: String,
    },



    // ================= TRANSACTION STATUS =================

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

const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);

export default Transaction;
