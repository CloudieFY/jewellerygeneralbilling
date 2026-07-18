import Invoice from "../models/Invoice.js";
import Farmer from "../models/Farmer.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

import generateDocumentNumber from "../utils/generateInvoiceNumber.js";
import {
  getPaymentStatus,
  recalculateCustomerLedger,
} from "../utils/customerLedger.js";
import { generateCustomerVoucherNumber } from "../utils/voucherNumber.js";

const normalizeAmount = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dateWithPreservedTime = (dateValue, timeSource = new Date()) => {
  if (!dateValue) return undefined;
  const selectedDate = new Date(`${dateValue}T00:00:00`);
  const source = new Date(timeSource);
  selectedDate.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
  return selectedDate;
};

const getReceivedAmount = (billingType, grandTotal, receivedAmount = 0) => {
  if (billingType === "cash") return grandTotal;

  const paid = Math.max(normalizeAmount(receivedAmount), 0);
  return Math.min(paid, grandTotal);
};

const createInvoiceLedgerEntries = async ({
  invoice,
  farmerId,
  receivedAmount,
  paymentMode = "cash",
  dueDate,
}) => {
  const entryDate = invoice.createdAt || new Date();

  await Transaction.create({
    farmer: farmerId,
    type: "credit",
    amount: invoice.grandTotal,
    invoice: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    voucherNo: await generateCustomerVoucherNumber("credit"),
    voucherDate: entryDate,
    description: `Invoice ${invoice.invoiceNumber}`,
    dueDate,
  });

  if (receivedAmount > 0) {
    await Transaction.create({
      farmer: farmerId,
      type: "payment",
      amount: receivedAmount,
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      voucherNo: await generateCustomerVoucherNumber("payment"),
      voucherDate: entryDate,
      paymentMode,
      description: `Received against Invoice ${invoice.invoiceNumber}`,
    });
  }
};

const deleteInvoiceLedgerEntries = async (invoice) => {
  await Transaction.deleteMany({
    $or: [
      { invoice: invoice._id },
      {
        farmer: invoice.farmer,
        invoiceNumber: invoice.invoiceNumber,
      },
      {
        farmer: invoice.farmer,
        type: "credit",
        description: `Invoice ${invoice.invoiceNumber}`,
      },
      {
        farmer: invoice.farmer,
        type: "payment",
        description: `Received against Invoice ${invoice.invoiceNumber}`,
      },
    ],
  });
};

// ================= CREATE INVOICE =================

export const createInvoice = async (req, res) => {
  try {
    const {
      farmerId,
      billingType = "credit",
      rateType,
      documentType = "gst_invoice",
      receivedAmount = 0,
      paymentMode = "cash",
      remarks = "",
      products = [],
      invoiceDate,
    } = req.body;

    // documentType determines GST on/off
    const gstEnabled = documentType === "gst_invoice";

    // farmer check

    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    if (!products.length) {
      return res.status(400).json({
        message: "At least one invoice item is required",
      });
    }

    const activeRateType = rateType || farmer.defaultRateType || "Rate A";

    let subTotal = 0;
    let totalGST = 0;

    const invoiceProducts = [];

    // process products

    for (const item of products) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      // auto rate selection

      let selectedRate = product.metalRatePerGram || 0;

      if (activeRateType === "Rate A") {
        selectedRate = product.metalRatePerGram || product.cashRate;
      } else if (activeRateType === "Rate B") {
        selectedRate = product.creditRate;
      } else if (activeRateType === "Rate C") {
        selectedRate = product.wholesaleRate;
      } else {
        selectedRate = product.cashRate;
      }

      if (item.selectedRate !== undefined && item.selectedRate !== "") {
        selectedRate = Number(item.selectedRate);
      }

      // calculations

      const quantity = Number(item.quantity) || 1;
      const grossWeight = Number(item.grossWeight ?? product.grossWeight) || 0;
      const netWeight = Number(item.netWeight ?? product.netWeight) || 0;
      const stoneWeight = Number(item.stoneWeight ?? product.stoneWeight) || 0;
      const wastagePercent = Number(item.wastagePercent ?? product.wastagePercent) || 0;
      const makingChargeType = item.makingChargeType || product.makingChargeType || "per_gram";
      const makingCharge = Number(item.makingCharge ?? product.makingCharge) || 0;
      const stoneValue = Number(item.stoneValue ?? product.stoneValue) || 0;
      const discount = Number(item.discount) || 0;

      // GST only applies for GST invoices
      const gstRate =
        gstEnabled
          ? (item.gstRate !== undefined && item.gstRate !== ""
              ? Number(item.gstRate)
              : product.gstRate || 0)
          : 0;

      if (netWeight <= 0 || selectedRate <= 0) return res.status(400).json({ message: "Net weight and metal rate must be greater than zero" });
      const metalValue = netWeight * selectedRate * quantity;
      const wastageAmount = metalValue * wastagePercent / 100;
      const makingChargeAmount = makingChargeType === "percent"
        ? metalValue * makingCharge / 100
        : makingChargeType === "fixed" ? makingCharge * quantity : makingCharge * netWeight * quantity;
      const itemTotal = Math.max(metalValue + wastageAmount + makingChargeAmount + stoneValue * quantity - discount, 0);

      const gstAmount = (itemTotal * gstRate) / 100;

      const finalAmount = itemTotal + gstAmount;

      subTotal += itemTotal;

      totalGST += gstAmount;

      invoiceProducts.push({
        product: product._id,

        // snapshot HSN code at time of invoice creation
        hsnCode: product.hsnCode || "",

        quantity,

        grossWeight, netWeight, stoneWeight,
        purity: product.purity, fineness: product.fineness, huid: product.huid,
        metalRatePerGram: selectedRate, wastagePercent, wastageAmount,
        makingChargeType, makingCharge, makingChargeAmount, stoneValue, discount,

        selectedRate,

        gstRate,

        baseAmount: itemTotal,

        gstAmount,

        totalAmount: finalAmount,
      });
    }

    // grand total

    const grandTotal = subTotal + totalGST;

    // document number (async, DB-backed sequential)

    const invoiceNumber = await generateDocumentNumber(documentType);

    if (normalizeAmount(receivedAmount) > grandTotal) {
      return res.status(400).json({
        message: "Received amount cannot be greater than grand total",
      });
    }

    const received = getReceivedAmount(billingType, grandTotal, receivedAmount);
    const balanceDue = Math.max(grandTotal - received, 0);
    const paymentStatus = getPaymentStatus(grandTotal, received);

    // create invoice

    const invoice = await Invoice.create({
      invoiceNumber,

      documentType,

      farmer: farmerId,

      billingType,

      rateType: activeRateType,

      products: invoiceProducts,

      gstEnabled,

      subTotal,

      totalGST,

      grandTotal,

      paidAmount: received,

      receivedAmount: received,

      balanceDue,

      paymentStatus,

      paymentMode,

      remarks: remarks || "",

      createdAt: dateWithPreservedTime(invoiceDate),
    });

    await createInvoiceLedgerEntries({
      invoice,
      farmerId: farmer._id,
      receivedAmount: received,
      paymentMode,
      dueDate: req.body.dueDate,
    });

    await recalculateCustomerLedger(farmer._id);

    res.status(201).json({
      success: true,
      message: "Invoice Created Successfully",
      invoice,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET ALL INVOICES =================

export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("farmer")
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalInvoices: invoices.length,
      invoices,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= SINGLE INVOICE =================

export const getSingleInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("farmer")
      .populate("products.product");

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= PRINT INVOICE =================

export const printInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("farmer")
      .populate("products.product");

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // also send settings for shop name/GST number on printout
    const Settings = (await import("../models/Settings.js")).default;
    const settings = await Settings.findOne() || {};

    res.status(200).json({
      success: true,
      printableInvoice: invoice,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= DELETE INVOICE =================

export const deleteInvoice = async (req, res) => {
  try {
    if (req.user && req.user.role === "operator") {
      return res.status(403).json({
        message: "Forbidden: Operator cannot delete invoice records",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const farmerId = invoice.farmer;

    await deleteInvoiceLedgerEntries(invoice);

    await Invoice.findByIdAndDelete(req.params.id);
    await recalculateCustomerLedger(farmerId);

    res.status(200).json({
      success: true,
      message: "Invoice deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= UPDATE INVOICE =================

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      farmerId,
      billingType = "credit",
      rateType,
      documentType = "gst_invoice",
      products = [],
      invoiceDate,
      receivedAmount,
      paymentMode = "cash",
      remarks,
    } = req.body;

    if (!products.length) {
      return res.status(400).json({
        message: "At least one invoice item is required",
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const oldFarmerId = invoice.farmer;

    const farmer = await Farmer.findById(farmerId || invoice.farmer);
    if (!farmer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const activeRateType = rateType || farmer.defaultRateType || "Rate A";
    const gstEnabled = documentType === "gst_invoice";

    let subTotal = 0;
    let totalGST = 0;
    const invoiceProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      let selectedRate = product.metalRatePerGram || product.cashRate || 0;
      if (activeRateType === "Rate B") {
        selectedRate = product.creditRate;
      } else if (activeRateType === "Rate C") {
        selectedRate = product.wholesaleRate;
      }

      if (item.selectedRate !== undefined && item.selectedRate !== "") {
        selectedRate = Number(item.selectedRate);
      }

      const quantity = Number(item.quantity) || 1;
      const grossWeight = Number(item.grossWeight ?? product.grossWeight) || 0;
      const netWeight = Number(item.netWeight ?? product.netWeight) || 0;
      const stoneWeight = Number(item.stoneWeight ?? product.stoneWeight) || 0;
      const wastagePercent = Number(item.wastagePercent ?? product.wastagePercent) || 0;
      const makingChargeType = item.makingChargeType || product.makingChargeType || "per_gram";
      const makingCharge = Number(item.makingCharge ?? product.makingCharge) || 0;
      const stoneValue = Number(item.stoneValue ?? product.stoneValue) || 0;
      const discount = Number(item.discount) || 0;

      if (!product._id || quantity <= 0 || netWeight <= 0 || selectedRate <= 0) {
        return res.status(400).json({
          message: "Invoice items must have valid product, net weight, quantity, and metal rate",
        });
      }

      const gstRate = gstEnabled
        ? item.gstRate !== undefined && item.gstRate !== ""
          ? Number(item.gstRate)
          : product.gstRate || 0
        : 0;

      const metalValue = netWeight * selectedRate * quantity;
      const wastageAmount = metalValue * wastagePercent / 100;
      const makingChargeAmount = makingChargeType === "percent"
        ? metalValue * makingCharge / 100
        : makingChargeType === "fixed"
          ? makingCharge * quantity
          : makingCharge * netWeight * quantity;
      const itemTotal = Math.max(
        metalValue + wastageAmount + makingChargeAmount + stoneValue * quantity - discount,
        0,
      );
      const gstAmount = (itemTotal * gstRate) / 100;
      const finalAmount = itemTotal + gstAmount;

      subTotal += itemTotal;
      totalGST += gstAmount;

      invoiceProducts.push({
        product: product._id,
        hsnCode: product.hsnCode || "",
        quantity,
        grossWeight,
        netWeight,
        stoneWeight,
        purity: product.purity,
        fineness: product.fineness,
        huid: product.huid,
        metalRatePerGram: selectedRate,
        wastagePercent,
        wastageAmount,
        makingChargeType,
        makingCharge,
        makingChargeAmount,
        stoneValue,
        discount,
        selectedRate,
        gstRate,
        baseAmount: itemTotal,
        gstAmount,
        totalAmount: finalAmount,
      });
    }

    const grandTotal = subTotal + totalGST;
    const requestedReceived =
      receivedAmount !== undefined
        ? receivedAmount
        : invoice.paidAmount ?? invoice.receivedAmount ?? 0;

    if (normalizeAmount(requestedReceived) > grandTotal) {
      return res.status(400).json({
        message: "Received amount cannot be greater than grand total",
      });
    }

    const received = getReceivedAmount(billingType, grandTotal, requestedReceived);
    const balanceDue = Math.max(grandTotal - received, 0);
    const paymentStatus = getPaymentStatus(grandTotal, received);

    await deleteInvoiceLedgerEntries(invoice);

    invoice.farmer = farmer._id;
    invoice.billingType = billingType;
    invoice.rateType = activeRateType;
    invoice.documentType = documentType;
    invoice.gstEnabled = gstEnabled;
    invoice.products = invoiceProducts;
    invoice.subTotal = subTotal;
    invoice.totalGST = totalGST;
    invoice.grandTotal = grandTotal;
    invoice.paidAmount = received;
    invoice.receivedAmount = received;
    invoice.balanceDue = balanceDue;
    invoice.paymentStatus = paymentStatus;
    invoice.paymentMode = paymentMode;
    if (remarks !== undefined) invoice.remarks = remarks;
    if (invoiceDate) {
      invoice.createdAt = dateWithPreservedTime(invoiceDate, invoice.createdAt);
    }

    await invoice.save();

    await createInvoiceLedgerEntries({
      invoice,
      farmerId: farmer._id,
      receivedAmount: received,
      paymentMode,
      dueDate: req.body.dueDate,
    });

    await recalculateCustomerLedger(oldFarmerId);
    if (String(oldFarmerId) !== String(farmer._id)) {
      await recalculateCustomerLedger(farmer._id);
    }

    res.status(200).json({
      success: true,
      message: "Invoice Updated Successfully",
      invoice,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
