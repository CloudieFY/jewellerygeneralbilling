import Vendor from "../models/Vendor.js";
import VendorTransaction from "../models/VendorTransaction.js";
import {
  buildVendorStatement,
  recalculateVendorLedger,
} from "../utils/vendorLedger.js";
import { generateVendorVoucherNumber } from "../utils/voucherNumber.js";

const upsertOpeningBalance = async (vendorId, openingBalance = 0) => {
  const amount = Number(openingBalance) || 0;
  const existing = await VendorTransaction.findOne({
    vendor: vendorId,
    type: "opening",
  });

  if (amount <= 0) {
    if (existing) {
      await VendorTransaction.findByIdAndDelete(existing._id);
    }
    return;
  }

  if (existing) {
    existing.amount = amount;
    existing.remarks = "Opening Balance";
    existing.voucherNo = existing.voucherNo || await generateVendorVoucherNumber("opening");
    existing.voucherDate = existing.voucherDate || new Date();
    await existing.save();
    return;
  }

  await VendorTransaction.create({
    vendor: vendorId,
    type: "opening",
    amount,
    voucherNo: await generateVendorVoucherNumber("opening"),
    voucherDate: new Date(),
    remarks: "Opening Balance",
  });
};

const attachVendorStats = async (vendor) => {
  await recalculateVendorLedger(vendor._id);
  const [freshVendor, transactions] = await Promise.all([
    Vendor.findById(vendor._id),
    VendorTransaction.find({ vendor: vendor._id }),
  ]);
  const data = freshVendor.toObject();
  const totalPurchase = transactions
    .filter((entry) => ["opening", "purchase"].includes(entry.type))
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const totalPaid = transactions
    .filter((entry) => ["payment", "expense"].includes(entry.type))
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  return {
    ...data,
    totalPurchase,
    totalPaid,
    outstandingBalance: data.dueAmount || 0,
  };
};

export const createVendor = async (req, res) => {
  try {
    const {
      vendorName,
      mobile = "",
      gstNumber = "",
      address = "",
      openingBalance = 0,
      status = "active",
    } = req.body;

    if (!vendorName) {
      return res.status(400).json({
        message: "Vendor name is required",
      });
    }

    const vendor = await Vendor.create({
      vendorName,
      mobile,
      gstNumber,
      address,
      openingBalance: Number(openingBalance) || 0,
      status,
    });

    await upsertOpeningBalance(vendor._id, openingBalance);
    await recalculateVendorLedger(vendor._id);

    res.status(201).json({
      success: true,
      message: "Vendor Added Successfully",
      vendor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    const vendorsWithStats = await Promise.all(vendors.map(attachVendorStats));

    res.status(200).json({
      success: true,
      totalVendors: vendorsWithStats.length,
      vendors: vendorsWithStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSingleVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      success: true,
      vendor: await attachVendorStats(vendor),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    if (Object.prototype.hasOwnProperty.call(req.body, "openingBalance")) {
      await upsertOpeningBalance(updatedVendor._id, updatedVendor.openingBalance);
    }
    await recalculateVendorLedger(updatedVendor._id);

    res.status(200).json({
      success: true,
      message: "Vendor Updated Successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    await VendorTransaction.deleteMany({ vendor: vendor._id });
    await Vendor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Vendor Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendorPurchase = async (req, res) => {
  try {
    const {
      vendorId,
      amount,
      billNo = "",
      voucherDate,
      remarks = "",
    } = req.body;

    const vendor = await Vendor.findById(vendorId);
    const purchaseAmount = Number(amount) || 0;

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    if (purchaseAmount <= 0) {
      return res.status(400).json({ message: "Purchase amount must be greater than zero" });
    }

    const transaction = await VendorTransaction.create({
      vendor: vendorId,
      type: "purchase",
      amount: purchaseAmount,
      billNo,
      voucherNo: await generateVendorVoucherNumber("purchase"),
      voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
      remarks,
    });

    await recalculateVendorLedger(vendorId);

    res.status(201).json({
      success: true,
      message: "Purchase Voucher Added",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendorPayment = async (req, res) => {
  try {
    const {
      vendorId,
      amount,
      paymentMode = "cash",
      voucherDate,
      remarks = "",
    } = req.body;

    const vendor = await Vendor.findById(vendorId);
    const paymentAmount = Number(amount) || 0;

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    if (paymentAmount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than zero" });
    }
    if (paymentAmount > Number(vendor.dueAmount || 0)) {
      return res.status(400).json({ message: "Payment exceeds vendor outstanding" });
    }

    const transaction = await VendorTransaction.create({
      vendor: vendorId,
      type: "payment",
      amount: paymentAmount,
      paymentMode,
      voucherNo: await generateVendorVoucherNumber("payment"),
      voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
      remarks,
    });

    await recalculateVendorLedger(vendorId);

    res.status(201).json({
      success: true,
      message: "Payment Voucher Added",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExpensePayment = async (req, res) => {
  try {
    const {
      amount,
      paymentMode = "cash",
      voucherDate,
      partyName = "",
      expenseHead = "Expense",
      remarks = "",
    } = req.body;

    const expenseAmount = Number(amount) || 0;

    if (expenseAmount <= 0) {
      return res.status(400).json({ message: "Expense amount must be greater than zero" });
    }

    const transaction = await VendorTransaction.create({
      type: "expense",
      amount: expenseAmount,
      paymentMode,
      partyName,
      expenseHead,
      voucherNo: await generateVendorVoucherNumber("expense"),
      voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Expense Voucher Added",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorLedger = async (req, res) => {
  try {
    const statementData = await buildVendorStatement(req.params.id);

    if (!statementData) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      success: true,
      vendor: statementData.vendor,
      summary: statementData.summary,
      statement: statementData.statement,
      ledger: statementData.statement,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorTransactions = async (req, res) => {
  try {
    const transactions = await VendorTransaction.find()
      .populate("vendor")
      .sort({ voucherDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
