import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // ================= DOCUMENT TYPE =================
    // "gst_invoice" = GST Invoice (GST-INV-XXXX series)
    // "order"       = Non-GST Order / Kaccha Bill (ORD-XXXX series)

    documentType: {
      type: String,
      enum: ["gst_invoice", "order"],
      default: "gst_invoice",
    },
    workflowStatus: {
      type: String,
      enum: ["inventory_reserved", "invoiced"],
      default: "inventory_reserved",
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    billingType: {
      type: String,
      enum: ["credit", "cash", "wholesale"],
      default: "credit",
    },

    rateType: {
      type: String,
      enum: ["Rate A", "Rate B", "Rate C"],
      default: "Rate A",
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        // HSN code snapshot at invoice creation time
        hsnCode: {
          type: String,
          default: "",
        },

        quantity: {
          type: Number,
          required: true,
        },

        length: {
          type: Number,
          default: 0,
        },

        width: {
          type: Number,
          default: 0,
        },

        sqFt: {
          type: Number,
          default: 0,
        },
        grossWeight: { type: Number, default: 0 },
        netWeight: { type: Number, default: 0 },
        stoneWeight: { type: Number, default: 0 },
        purity: { type: String, default: "" },
        fineness: { type: String, default: "" },
        huid: { type: String, default: "" },
        hallmarkCharge: { type: Number, default: 0 },
        metalRatePerGram: { type: Number, default: 0 },
        wastagePercent: { type: Number, default: 0 },
        wastageAmount: { type: Number, default: 0 },
        makingChargeType: { type: String, default: "per_gram" },
        makingCharge: { type: Number, default: 0 },
        makingChargeAmount: { type: Number, default: 0 },
        stoneValue: { type: Number, default: 0 },
        stoneValueType: { type: String, default: "per_piece" },
        stoneValueAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },

        selectedRate: {
          type: Number,
          required: true,
        },

        gstRate: {
          type: Number,
          default: 0,
        },

        baseAmount: {
          type: Number,
          default: 0,
        },

        gstAmount: {
          type: Number,
          default: 0,
        },

        totalAmount: {
          type: Number,
          required: true,
        },
      },
    ],

    gstEnabled: {
      type: Boolean,
      default: true,
    },

    subTotal: {
      type: Number,
      required: true,
    },

    totalGST: {
      type: Number,
      required: true,
    },

    roundOff: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    receivedAmount: {
      type: Number,
      default: 0,
    },

    balanceDue: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "partially_paid", "unpaid", "pending"],
      default: "unpaid",
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque"],
      default: "cash",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model(
  "Invoice",
  invoiceSchema
);

export default Invoice;
