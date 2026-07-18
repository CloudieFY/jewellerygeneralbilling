import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // ================= SHOP DETAILS =================

    shopName: {
      type: String,
      default: "",
    },

    shopAddress: {
      type: String,
      default: "",
    },

    shopMobile: {
      type: String,
      default: "",
    },

    shopEmail: {
      type: String,
      default: "",
    },

    invoiceBusinessLine: {
      type: String,
      default: "",
    },

    invoiceTermOne: {
      type: String,
      default: "",
    },

    invoiceTermTwo: {
      type: String,
      default: "",
    },

    invoiceMarginTop: {
      type: Number,
      default: 8,
      min: 0,
      max: 20,
    },

    invoiceMarginRight: {
      type: Number,
      default: 8,
      min: 0,
      max: 20,
    },

    invoiceMarginBottom: {
      type: Number,
      default: 8,
      min: 0,
      max: 20,
    },

    invoiceMarginLeft: {
      type: Number,
      default: 8,
      min: 0,
      max: 20,
    },

    invoiceDesign: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },



    // ================= GST DETAILS =================

    gstNumber: {
      type: String,
      default: "",
    },

    gstPercentage: {
      type: Number,
      default: 0,
    },



    // ================= BANK DETAILS =================

    bankName: {
      type: String,
      default: "",
    },

    bankBranch: {
      type: String,
      default: "",
    },

    accountHolderName: {
      type: String,
      default: "",
    },

    accountNumber: {
      type: String,
      default: "",
    },

    ifscCode: {
      type: String,
      default: "",
    },

    upiId: {
      type: String,
      default: "",
    },



    // ================= INTEREST SETTINGS =================

    monthlyInterestRate: {
      type: Number,
      default: 2,
    },

    autoInterestEnabled: {
      type: Boolean,
      default: true,
    },



    // ================= REMINDER SETTINGS =================

    reminderDaysBeforeDue: {
      type: Number,
      default: 1,
    },

    overdueReminderEnabled: {
      type: Boolean,
      default: true,
    },

    lowStockAlertEnabled: {
      type: Boolean,
      default: true,
    },



    // ================= INVOICE NUMBER SERIES =================

    gstInvoicePrefix: {
      type: String,
      default: "GST-INV",
    },

    orderPrefix: {
      type: String,
      default: "ORD",
    },

    gstInvoiceCounter: {
      type: Number,
      default: 0,
    },

    orderCounter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model(
  "Settings",
  settingsSchema
);

export default Settings;
