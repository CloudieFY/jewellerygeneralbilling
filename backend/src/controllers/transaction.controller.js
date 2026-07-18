import Transaction from "../models/Transaction.js";
import Farmer from "../models/Farmer.js";
import Product from "../models/Product.js";
import {
  buildCustomerStatement,
  recalculateCustomerLedger,
} from "../utils/customerLedger.js";
import { generateCustomerVoucherNumber } from "../utils/voucherNumber.js";



// ================= CREDIT ENTRY =================

export const createCreditTransaction = async (req, res) => {
  try {
    const {
      farmerId,
      amount,
      description,
      dueDate,
      products,
      voucherDate,
    } = req.body;

    // farmer check

    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    // credit limit warning

    if (farmer.dueAmount + amount > farmer.creditLimit) {
      return res.status(400).json({
        message: "Credit Limit Exceeded",
      });
    }

    // inventory deduction

    if (products && products.length > 0) {
      for (const item of products) {
        const product = await Product.findById(item.product);

        if (!product) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        // stock check

        if (product.quantity < item.quantity) {
          return res.status(400).json({
            message: `${product.productName} out of stock`,
          });
        }

        // deduct stock

        product.quantity -= item.quantity;

        await product.save();
      }
    }

    // create transaction

    const transaction = await Transaction.create({
      farmer: farmerId,
      type: "credit",
      amount,
      description,
      dueDate,
      products,
      voucherNo: await generateCustomerVoucherNumber("credit"),
      voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
    });

    // update due amount

    farmer.dueAmount += amount;

    await farmer.save();
    await recalculateCustomerLedger(farmer._id);

    res.status(201).json({
      success: true,
      message: "Credit Transaction Added",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= PAYMENT ENTRY =================

export const createPaymentTransaction = async (req, res) => {
  try {
    const {
      farmerId,
      amount,
      paymentMode,
      description,
      voucherNo,
      voucherDate,
    } = req.body;

    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    const paymentAmount = Number(amount) || 0;

    if (paymentAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero",
      });
    }

    // due check

    if (paymentAmount > farmer.dueAmount) {
      return res.status(400).json({
        message: "Payment exceeds due amount",
      });
    }

    // create payment transaction

    const transaction = await Transaction.create({
      farmer: farmerId,
      type: "payment",
      amount: paymentAmount,
      paymentMode: paymentMode || "cash",
      description,
      voucherNo: voucherNo || await generateCustomerVoucherNumber("payment"),
      voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
    });

    await recalculateCustomerLedger(farmer._id);

    res.status(201).json({
      success: true,
      message: "Payment Added Successfully",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= INTEREST ENTRY =================

export const createInterestTransaction = async (req, res) => {
  try {
    const {
      farmerId,
      amount,
      description,
    } = req.body;

    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    // create interest transaction

    const transaction = await Transaction.create({
      farmer: farmerId,
      type: "interest",
      amount,
      description,
      voucherNo: await generateCustomerVoucherNumber("interest"),
      voucherDate: new Date(),
    });

    // add due amount

    farmer.dueAmount += amount;

    await farmer.save();
    await recalculateCustomerLedger(farmer._id);

    res.status(201).json({
      success: true,
      message: "Interest Added Successfully",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= TRANSACTION HISTORY =================

export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("farmer")
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= FARMER LEDGER =================

export const getFarmerLedger = async (req, res) => {
  try {
    const farmerId = req.params.id;

    const statementData = await buildCustomerStatement(farmerId);

    if (!statementData) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    res.status(200).json({
      success: true,
      farmer: statementData.farmer,
      dueAmount: statementData.summary.outstandingBalance,
      summary: statementData.summary,
      statement: statementData.statement,
      ledger: statementData.statement,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= SEARCH & FILTER =================

export const searchTransactions = async (req, res) => {
  try {
    const { type, paymentMode } = req.query;

    let filter = {};

    if (type) {
      filter.type = type;
    }

    if (paymentMode) {
      filter.paymentMode = paymentMode;
    }

    const transactions = await Transaction.find(filter)
      .populate("farmer")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalResults: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= DELETE TRANSACTION =================

export const deleteTransaction = async (req, res) => {
  try {
    if (req.user && req.user.role === "operator") {
      return res.status(403).json({
        message: "Forbidden: Operator cannot delete payment records",
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    const farmerId = transaction.farmer;

    await Transaction.findByIdAndDelete(req.params.id);
    await recalculateCustomerLedger(farmerId);

    res.status(200).json({
      success: true,
      message: "Payment record deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
