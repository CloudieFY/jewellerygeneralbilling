import Invoice from "../models/Invoice.js";
import Farmer from "../models/Farmer.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

import generateDocumentNumber, {
  invoiceNumberExists,
  reserveManualDocumentNumber,
} from "../utils/generateInvoiceNumber.js";
import {
  getPaymentStatus,
  recalculateCustomerLedger,
} from "../utils/customerLedger.js";
import { generateCustomerVoucherNumber } from "../utils/voucherNumber.js";

const adjustInventory = async (items, direction) => {
  for (const item of items) {
    const weight = (Number(item.grossWeight) || 0) * (Number(item.quantity) || 1);
    if (weight <= 0) continue;
    await Product.findByIdAndUpdate(item.product, {
      $inc: { inventoryWeight: direction * weight },
    });
  }
};

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
  if (Math.abs(grandTotal - paid) <= 0.5) return grandTotal;
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
    createdAt: entryDate,
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
      createdAt: entryDate,
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
      invoiceNumber: requestedInvoiceNumber,
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
    const inventoryUsage = new Map();

    // process products

    for (const item of products) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      // auto rate selection

      const selectedRate = Number(item.selectedRate) || 0;
      const rateUnit = item.rateUnit || "per_gram";

      // calculations

      const quantity = Number(item.quantity) || 1;
      const grossWeight = Number(item.grossWeight !== undefined && item.grossWeight !== "" ? item.grossWeight : product.grossWeight) || 0;
      const stoneWeight = Number(item.stoneWeight !== undefined && item.stoneWeight !== "" ? item.stoneWeight : 0) || 0;
      const providedNet = Number(item.netWeight);
      const netWeight = (Number.isFinite(providedNet) && providedNet > 0)
        ? providedNet
        : Math.round((Math.max(grossWeight - stoneWeight, 0) + Number.EPSILON) * 1000) / 1000;
      const wastagePercent = Number(item.wastagePercent ?? product.wastagePercent) || 0;
      const makingChargeType = item.makingChargeType || "per_gram";
      const makingCharge = Number(item.makingCharge) || 0;
      const stoneValue = Number(item.stoneValue) || 0;
      const stoneValueType = item.stoneValueType || "per_piece";
      const stoneValueAmount = stoneValueType === "per_gram"
        ? stoneValue * stoneWeight * quantity
        : stoneValueType === "fixed" ? stoneValue : stoneValue * quantity;
      const hallmarkCharge = Number(item.hallmarkCharge) || 0;
      const discount = Number(item.discount) || 0;

      // GST only applies for GST invoices
      const gstRate =
        gstEnabled
          ? (item.gstRate !== undefined && item.gstRate !== ""
              ? Number(item.gstRate)
              : product.gstRate || 0)
          : 0;

      if (netWeight <= 0 || selectedRate <= 0) return res.status(400).json({ message: "Net weight and metal rate must be greater than zero" });
      
      let ratePerGram = selectedRate;
      if (rateUnit === "per_10_gram") {
        ratePerGram = selectedRate / 10;
      } else if (rateUnit === "per_kg") {
        ratePerGram = selectedRate / 1000;
      }

      const metalValue = netWeight * ratePerGram * quantity;
      const wastageAmount = metalValue * wastagePercent / 100;
      const makingChargeAmount = makingChargeType === "percent"
        ? metalValue * makingCharge / 100
        : makingChargeType === "per_piece" ? makingCharge * quantity
          : makingChargeType === "fixed" ? makingCharge : makingCharge * netWeight * quantity;
      const itemTotal = Math.max(metalValue + wastageAmount + makingChargeAmount + stoneValueAmount + hallmarkCharge - discount, 0);

      const inventoryNeeded = grossWeight * quantity;
      const totalInventoryNeeded = (inventoryUsage.get(String(product._id)) || 0) + inventoryNeeded;
      inventoryUsage.set(String(product._id), totalInventoryNeeded);
      if (totalInventoryNeeded > Number(product.inventoryWeight || 0)) {
        return res.status(400).json({ message: `Insufficient inventory for ${product.productName}. Available: ${Number(product.inventoryWeight || 0)} g` });
      }

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
        purity: item.purity || "", fineness: item.fineness || "", huid: "",
        hallmarkCharge,
        metalRatePerGram: ratePerGram, wastagePercent, wastageAmount,
        makingChargeType, makingCharge, makingChargeAmount,
        stoneValue, stoneValueType, stoneValueAmount, discount,

        selectedRate,
        rateUnit,

        gstRate,

        baseAmount: itemTotal,

        gstAmount,

        totalAmount: finalAmount,
      });
    }

    // grand total

    const exactTotal = subTotal + totalGST;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Math.round((grandTotal - exactTotal + Number.EPSILON) * 100) / 100;

    // document number (async, DB-backed sequential)

    const manualInvoiceNumber = typeof requestedInvoiceNumber === "string" ? requestedInvoiceNumber.trim() : "";
    if (manualInvoiceNumber && await invoiceNumberExists(manualInvoiceNumber, documentType)) {
      return res.status(400).json({ message: "Invoice number already exists. Please use a different number." });
    }
    if (manualInvoiceNumber) {
      await reserveManualDocumentNumber(manualInvoiceNumber, documentType);
    }
    const invoiceNumber = manualInvoiceNumber || await generateDocumentNumber(documentType);

    const received = getReceivedAmount(billingType, grandTotal, receivedAmount);
    const balanceDue = Math.max(grandTotal - received, 0);
    const paymentStatus = getPaymentStatus(grandTotal, received);

    // create invoice

    const invoice = await Invoice.create({
      invoiceNumber,

      documentType,
      workflowStatus: documentType === "order" ? "inventory_reserved" : "invoiced",

      farmer: farmerId,

      billingType: "credit",

      rateType: activeRateType,

      products: invoiceProducts,

      gstEnabled,

      subTotal,

      totalGST,

      roundOff,

      grandTotal,

      paidAmount: received,

      receivedAmount: received,

      balanceDue,

      paymentStatus,

      paymentMode,

      remarks: remarks || "",

      createdAt: dateWithPreservedTime(invoiceDate),
    });

    await adjustInventory(invoiceProducts, -1);

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
    if (error?.code === 11000 && error?.keyPattern?.invoiceNumber) {
      return res.status(400).json({ message: "Invoice number already exists. Please use a different number." });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET ALL INVOICES =================

export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      isDeleted: { $ne: true },
      deleted: { $ne: true },
      status: { $ne: "deleted" },
    })
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
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
      deleted: { $ne: true },
      status: { $ne: "deleted" },
    })
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
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
      deleted: { $ne: true },
      status: { $ne: "deleted" },
    })
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
    const linkedPayments = await Transaction.aggregate([
      { $match: { invoice: invoice._id, type: "payment" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const savedReceivedForPrint = Math.max(
      normalizeAmount(invoice.receivedAmount),
      normalizeAmount(invoice.paidAmount),
      normalizeAmount(linkedPayments[0]?.total)
    );
    const printableGrandTotal = normalizeAmount(invoice.grandTotal);
    const receivedForPrint = Math.abs(printableGrandTotal - savedReceivedForPrint) <= 0.5
      ? printableGrandTotal
      : savedReceivedForPrint;
    const printableInvoice = invoice.toObject();
    printableInvoice.receivedAmount = receivedForPrint;
    printableInvoice.paidAmount = receivedForPrint;
    printableInvoice.balanceDue = Math.max(
      printableGrandTotal - receivedForPrint,
      0
    );

    res.status(200).json({
      success: true,
      printableInvoice,
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

    await adjustInventory(invoice.products, 1);
    invoice.isDeleted = true;
    await invoice.save();
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
      invoiceNumber: requestedInvoiceNumber,
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
    const inventoryUsage = new Map();

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const selectedRate = Number(item.selectedRate) || 0;
      const rateUnit = item.rateUnit || "per_gram";

      const quantity = Number(item.quantity) || 1;
      const providedGross = Number(item.grossWeight);
      const providedNet = Number(item.netWeight);
      const grossWeightRaw = Number.isFinite(providedGross) && providedGross > 0
        ? providedGross
        : (Number.isFinite(providedNet) && providedNet > 0 ? providedNet : Number(product.grossWeight || 0));
      const stoneWeight = Number(item.stoneWeight !== undefined && item.stoneWeight !== "" ? item.stoneWeight : 0) || 0;
      const netWeight = (Number.isFinite(providedNet) && providedNet > 0)
        ? providedNet
        : Math.round((Math.max(grossWeightRaw - stoneWeight, 0) + Number.EPSILON) * 1000) / 1000;
      const grossWeight = grossWeightRaw > 0 ? grossWeightRaw : (netWeight > 0 ? netWeight + stoneWeight : 0);
      const wastagePercent = Number(item.wastagePercent ?? product.wastagePercent) || 0;
      const makingChargeType = item.makingChargeType || "per_gram";
      const makingCharge = Number(item.makingCharge) || 0;
      const stoneValue = Number(item.stoneValue) || 0;
      const stoneValueType = item.stoneValueType || "per_piece";
      const stoneValueAmount = stoneValueType === "per_gram"
        ? stoneValue * stoneWeight * quantity
        : stoneValueType === "fixed" ? stoneValue : stoneValue * quantity;
      const hallmarkCharge = Number(item.hallmarkCharge) || 0;
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

      let ratePerGram = selectedRate;
      if (rateUnit === "per_10_gram") {
        ratePerGram = selectedRate / 10;
      } else if (rateUnit === "per_kg") {
        ratePerGram = selectedRate / 1000;
      }

      const metalValue = netWeight * ratePerGram * quantity;
      const wastageAmount = metalValue * wastagePercent / 100;
      const makingChargeAmount = makingChargeType === "percent"
        ? metalValue * makingCharge / 100
        : makingChargeType === "per_piece"
          ? makingCharge * quantity
          : makingChargeType === "fixed" ? makingCharge : makingCharge * netWeight * quantity;
      const itemTotal = Math.max(
        metalValue + wastageAmount + makingChargeAmount + stoneValueAmount + hallmarkCharge - discount,
        0,
      );

      const oldWeight = invoice.products
        .filter((existing) => String(existing.product) === String(product._id))
        .reduce((total, existing) => total + Number(existing.grossWeight || 0) * Number(existing.quantity || 1), 0);
      const availableWithOldWeight = Number(product.inventoryWeight || 0) + oldWeight;
      const nextUsage = (inventoryUsage.get(String(product._id)) || 0) + grossWeight * quantity;
      inventoryUsage.set(String(product._id), nextUsage);
      if (nextUsage > availableWithOldWeight) {
        return res.status(400).json({ message: `Insufficient inventory for ${product.productName}. Available: ${availableWithOldWeight} g` });
      }
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
        purity: item.purity || "",
        fineness: item.fineness || "",
        huid: "",
        hallmarkCharge,
        metalRatePerGram: ratePerGram,
        wastagePercent,
        wastageAmount,
        makingChargeType,
        makingCharge,
        makingChargeAmount,
        stoneValue,
        stoneValueType,
        stoneValueAmount,
        discount,
        selectedRate,
        rateUnit,
        gstRate,
        baseAmount: itemTotal,
        gstAmount,
        totalAmount: finalAmount,
      });
    }

    const exactTotal = subTotal + totalGST;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Math.round((grandTotal - exactTotal + Number.EPSILON) * 100) / 100;
    const received = getReceivedAmount(billingType, grandTotal, receivedAmount);
    const balanceDue = Math.max(grandTotal - received, 0);
    const paymentStatus = getPaymentStatus(grandTotal, received);

    const manualInvoiceNumber = typeof requestedInvoiceNumber === "string" ? requestedInvoiceNumber.trim() : "";
    if (manualInvoiceNumber && await invoiceNumberExists(
      manualInvoiceNumber,
      documentType,
      invoice._id
    )) {
      return res.status(400).json({ message: "Invoice number already exists. Please use a different number." });
    }
    if (manualInvoiceNumber) {
      await reserveManualDocumentNumber(manualInvoiceNumber, documentType);
    }

    await deleteInvoiceLedgerEntries(invoice);
    await adjustInventory(invoice.products, 1);

    invoice.farmer = farmer._id;
    if (manualInvoiceNumber) invoice.invoiceNumber = manualInvoiceNumber;
    invoice.billingType = "credit";
    invoice.rateType = activeRateType;
    invoice.documentType = documentType;
    invoice.workflowStatus = documentType === "order" ? "inventory_reserved" : "invoiced";
    invoice.gstEnabled = gstEnabled;
    invoice.products = invoiceProducts;
    invoice.subTotal = subTotal;
    invoice.totalGST = totalGST;
    invoice.roundOff = roundOff;
    invoice.grandTotal = grandTotal;
    invoice.paidAmount = received;
    invoice.receivedAmount = received;
    invoice.balanceDue = balanceDue;
    invoice.paymentStatus = paymentStatus;
    invoice.paymentMode = paymentMode;
    if (remarks !== undefined) invoice.remarks = remarks;
    if (invoiceDate) {
      const newCreatedAt = dateWithPreservedTime(invoiceDate, invoice.createdAt);
      invoice.createdAt = newCreatedAt;
      await Invoice.updateOne({ _id: invoice._id }, { $set: { createdAt: newCreatedAt } });
    }

    await invoice.save();

    await adjustInventory(invoiceProducts, -1);

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
