import Invoice from "../models/Invoice.js";
import Farmer from "../models/Farmer.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import VendorTransaction from "../models/VendorTransaction.js";



// ================= SALES REPORT =================

export const salesReport = async (req, res) => {
  try {

    const invoices = await Invoice.aggregate([

      {
        $group: {

          _id: "$billingType",

          totalSales: {
            $sum: "$grandTotal",
          },

          totalInvoices: {
            $sum: 1,
          },
        },
      },
    ]);



    const overallSales = await Invoice.aggregate([

      {
        $group: {

          _id: null,

          totalRevenue: {
            $sum: "$grandTotal",
          },

          totalGST: {
            $sum: "$totalGST",
          },

          totalInvoices: {
            $sum: 1,
          },
        },
      },
    ]);



    res.status(200).json({
      success: true,

      billingTypeWiseSales: invoices,

      overallSales:
        overallSales[0] || {},
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};



// ================= FARMER DUE REPORT =================

export const farmerDueReport = async (req, res) => {
  try {

    const farmers = await Farmer.find({
      dueAmount: {
        $gt: 0,
      },
    }).sort({
      dueAmount: -1,
    });



    const totalDue = await Farmer.aggregate([

      {
        $group: {

          _id: null,

          totalPendingDue: {
            $sum: "$dueAmount",
          },
        },
      },
    ]);



    res.status(200).json({
      success: true,

      totalPendingDue:
        totalDue[0]?.totalPendingDue || 0,

      farmers,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};



// ================= STOCK REPORT =================

export const stockReport = async (req, res) => {
  try {

    const products = await Product.find()
      .sort({
        quantity: 1,
      });



    const totalStockValue = await Product.aggregate([

      {
        $group: {

          _id: null,

          stockValue: {
            $sum: {
              $multiply: [
                "$quantity",
                "$purchasePrice",
              ],
            },
          },
        },
      },
    ]);



    res.status(200).json({
      success: true,

      totalStockValue:
        totalStockValue[0]?.stockValue || 0,

      products,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};



// ================= VILLAGE REPORT =================

export const villageReport = async (req, res) => {
  try {

    const villages = await Farmer.aggregate([

      {
        $group: {

          _id: "$village",

          totalFarmers: {
            $sum: 1,
          },

          totalDue: {
            $sum: "$dueAmount",
          },

          activeFarmers: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "active",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $sort: {
          totalDue: -1,
        },
      },
    ]);



    res.status(200).json({
      success: true,
      villages,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};



// ================= CHART ANALYTICS =================

export const chartAnalytics = async (req, res) => {
  try {

    // monthly sales chart

    const monthlySales =
      await Invoice.aggregate([

        {
          $group: {

            _id: {
              month: {
                $month: "$createdAt",
              },
            },

            totalSales: {
              $sum: "$grandTotal",
            },
          },
        },

        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]);



    // transaction type chart

    const transactionTypes =
      await Transaction.aggregate([

        {
          $group: {

            _id: "$type",

            totalAmount: {
              $sum: "$amount",
            },

            totalTransactions: {
              $sum: 1,
            },
          },
        },
      ]);



    // category stock chart

    const categoryStock =
      await Product.aggregate([

        {
          $group: {

            _id: "$category",

            totalProducts: {
              $sum: 1,
            },

            totalQuantity: {
              $sum: "$quantity",
            },
          },
        },
      ]);



    res.status(200).json({
      success: true,

      monthlySales,

      transactionTypes,

      categoryStock,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};



// ================= DASHBOARD SUMMARY =================

export const dashboardSummary = async (req, res) => {
  try {

    // ================= BASIC COUNTS =================

    const totalFarmers =
      await Farmer.countDocuments();

    const totalProducts =
      await Product.countDocuments();

    const totalInvoices =
      await Invoice.countDocuments();



    // ================= TOTAL SALES =================

    const totalSales =
      await Invoice.aggregate([
        {
          $group: {
            _id: null,

            sales: {
              $sum: "$grandTotal",
            },
          },
        },
      ]);



    // ================= PENDING PAYMENTS =================

    const pendingPayments =
      await Farmer.aggregate([
        {
          $group: {
            _id: null,

            totalDue: {
              $sum: "$dueAmount",
            },
          },
        },
      ]);



    // ================= LOW STOCK =================

    const lowStockProducts =
      await Product.find({
        $expr: {
          $lte: [
            "$quantity",
            "$lowStockThreshold",
          ],
        },
      });



    // ================= OVERDUE BILLS =================

    const today = new Date();

    const overdueBills =
      await Transaction.find({
        type: "credit",

        dueDate: {
          $lt: today,
        },
      });



    // ================= INTEREST EARNED =================

    const interestEarned =
      await Transaction.aggregate([

        {
          $match: {
            type: "interest",
          },
        },

        {
          $group: {

            _id: null,

            totalInterest: {
              $sum: "$amount",
            },
          },
        },
      ]);



    // ================= RECENT TRANSACTIONS =================

    const recentTransactions =
      await Transaction.find()
        .populate("farmer")
        .sort({
          createdAt: -1,
        })
        .limit(10);



    const cashSales = await Invoice.aggregate([
      { $match: { billingType: "cash" } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);

    const creditSales = await Invoice.aggregate([
      { $match: { billingType: { $ne: "cash" } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);

    const totalReceipts = await Transaction.aggregate([
      { $match: { type: "payment" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // ================= RESPONSE =================

    res.status(200).json({
      success: true,

      dashboard: {

        totalFarmers,

        totalProducts,

        totalInvoices,

        totalSales:
          totalSales[0]?.sales || 0,

        cashSales:
          cashSales[0]?.total || 0,

        creditSales:
          creditSales[0]?.total || 0,

        pendingPayments:
          pendingPayments[0]?.totalDue || 0,

        outstandingAmount:
          pendingPayments[0]?.totalDue || 0,

        totalReceipts:
          totalReceipts[0]?.total || 0,

        totalCustomers:
          totalFarmers,

        overdueBills:
          overdueBills.length,

        interestEarned:
          interestEarned[0]?.totalInterest || 0,

        lowStockAlerts:
          lowStockProducts.length,

        recentTransactions,
      },
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const outstandingReport = async (req, res) => {
  try {
    const customers = await Farmer.find({ dueAmount: { $gt: 0 } }).sort({
      dueAmount: -1,
    });

    const rows = await Promise.all(
      customers.map(async (customer) => {
        const [lastInvoice, lastPayment] = await Promise.all([
          Invoice.findOne({ farmer: customer._id }).sort({ createdAt: -1 }),
          Transaction.findOne({ farmer: customer._id, type: "payment" }).sort({
            voucherDate: -1,
            createdAt: -1,
          }),
        ]);

        return {
          customerId: customer._id,
          customerName: customer.name,
          mobile: customer.mobileNumber,
          outstanding: customer.dueAmount || 0,
          lastInvoiceDate: lastInvoice?.createdAt || null,
          lastPaymentDate: lastPayment?.voucherDate || lastPayment?.createdAt || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      totalOutstanding: rows.reduce(
        (total, row) => total + Number(row.outstanding || 0),
        0
      ),
      rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const salesRegister = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("farmer")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rows: invoices.map((invoice) => ({
        _id: invoice._id,
        date: invoice.createdAt,
        invoiceNo: invoice.invoiceNumber,
        customerName: invoice.farmer?.name || "-",
        type: invoice.documentType,
        paymentType: invoice.billingType,
        taxable: invoice.subTotal || 0,
        gst: invoice.totalGST || 0,
        total: invoice.grandTotal || 0,
        status: invoice.paymentStatus,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const receiptRegister = async (req, res) => {
  try {
    const receipts = await Transaction.find({ type: "payment" })
      .populate("farmer")
      .sort({ voucherDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      rows: receipts.map((receipt) => ({
        _id: receipt._id,
        date: receipt.voucherDate || receipt.createdAt,
        voucherNo: receipt.voucherNo,
        customerName: receipt.farmer?.name || "-",
        invoiceNo: receipt.invoiceNumber || "-",
        paymentMode: receipt.paymentMode,
        amount: receipt.amount || 0,
        remarks: receipt.description || "",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const purchaseRegister = async (req, res) => {
  try {
    const purchases = await VendorTransaction.find({ type: "purchase" })
      .populate("vendor")
      .sort({ voucherDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      rows: purchases.map((purchase) => ({
        _id: purchase._id,
        date: purchase.voucherDate || purchase.createdAt,
        voucherNo: purchase.voucherNo,
        billNo: purchase.billNo || "-",
        vendorName: purchase.vendor?.vendorName || "-",
        amount: purchase.amount || 0,
        remarks: purchase.remarks || "",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const paymentRegister = async (req, res) => {
  try {
    const payments = await VendorTransaction.find({
      type: { $in: ["payment", "expense"] },
    })
      .populate("vendor")
      .sort({ voucherDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      rows: payments.map((payment) => ({
        _id: payment._id,
        date: payment.voucherDate || payment.createdAt,
        voucherNo: payment.voucherNo,
        vendorName: payment.vendor?.vendorName || payment.partyName || payment.expenseHead || "-",
        paymentMode: payment.paymentMode,
        amount: payment.amount || 0,
        remarks: payment.remarks || "",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const dayBook = async (req, res) => {
  try {
    const [invoices, receipts, vendorEntries] = await Promise.all([
      Invoice.find().populate("farmer"),
      Transaction.find({ type: { $in: ["opening", "credit", "payment", "interest"] } }).populate("farmer"),
      VendorTransaction.find().populate("vendor"),
    ]);

    const sales = invoices.map((invoice) => ({
      date: invoice.createdAt,
      voucherType: invoice.documentType === "order" ? "Order" : "Sales",
      voucherNo: invoice.invoiceNumber,
      party: invoice.farmer?.name || "-",
      debit: invoice.grandTotal || 0,
      credit: 0,
      remarks: invoice.paymentStatus,
    }));
    const customerEntries = receipts.map((entry) => ({
      date: entry.voucherDate || entry.createdAt,
      voucherType: entry.type === "payment" ? "Receipt" : entry.type,
      voucherNo: entry.voucherNo || entry.invoiceNumber || "-",
      party: entry.farmer?.name || "-",
      debit: entry.type === "payment" ? 0 : entry.amount || 0,
      credit: entry.type === "payment" ? entry.amount || 0 : 0,
      remarks: entry.description || "",
    }));
    const vendorRows = vendorEntries.map((entry) => ({
      date: entry.voucherDate || entry.createdAt,
      voucherType: entry.type,
      voucherNo: entry.voucherNo || "-",
      party: entry.vendor?.vendorName || entry.partyName || entry.expenseHead || "-",
      debit: ["payment", "expense"].includes(entry.type) ? entry.amount || 0 : 0,
      credit: ["opening", "purchase"].includes(entry.type) ? entry.amount || 0 : 0,
      remarks: entry.remarks || "",
    }));
    const rows = [...sales, ...customerEntries, ...vendorRows].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({ success: true, rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cashBook = async (req, res) => {
  try {
    const [receipts, payments] = await Promise.all([
      Transaction.find({ type: "payment", paymentMode: "cash" }).populate("farmer"),
      VendorTransaction.find({
        type: { $in: ["payment", "expense"] },
        paymentMode: "cash",
      }).populate("vendor"),
    ]);

    let runningBalance = 0;
    const rows = [
      ...receipts.map((entry) => ({
        date: entry.voucherDate || entry.createdAt,
        voucherType: "Receipt",
        voucherNo: entry.voucherNo || "-",
        party: entry.farmer?.name || "-",
        debit: entry.amount || 0,
        credit: 0,
        remarks: entry.description || "",
      })),
      ...payments.map((entry) => ({
        date: entry.voucherDate || entry.createdAt,
        voucherType: "Payment",
        voucherNo: entry.voucherNo || "-",
        party: entry.vendor?.vendorName || entry.partyName || entry.expenseHead || "-",
        debit: 0,
        credit: entry.amount || 0,
        remarks: entry.remarks || "",
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const rowsWithBalance = rows.map((row) => {
      runningBalance += Number(row.debit || 0) - Number(row.credit || 0);
      return { ...row, runningBalance };
    });

    res.status(200).json({ success: true, rows: rowsWithBalance.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
