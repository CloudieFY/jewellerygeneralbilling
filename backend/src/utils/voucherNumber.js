import Transaction from "../models/Transaction.js";
import VendorTransaction from "../models/VendorTransaction.js";

const pad = (value) => String(value).padStart(4, "0");

export const generateCustomerVoucherNumber = async (type = "payment") => {
  const prefixMap = {
    opening: "OB",
    credit: "CR",
    payment: "RCPT",
    interest: "INT",
  };
  const prefix = prefixMap[type] || "VCH";
  const count = await Transaction.countDocuments({ type });

  return `${prefix}-${pad(count + 1)}`;
};

export const generateVendorVoucherNumber = async (type = "payment") => {
  const prefixMap = {
    opening: "VOB",
    purchase: "PUR",
    payment: "PAY",
    expense: "EXP",
  };
  const prefix = prefixMap[type] || "VV";
  const count = await VendorTransaction.countDocuments({ type });

  return `${prefix}-${pad(count + 1)}`;
};
