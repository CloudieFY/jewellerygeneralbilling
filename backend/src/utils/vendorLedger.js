import Vendor from "../models/Vendor.js";
import VendorTransaction from "../models/VendorTransaction.js";

export const recalculateVendorLedger = async (vendorId) => {
  const [vendor, transactions] = await Promise.all([
    Vendor.findById(vendorId),
    VendorTransaction.find({ vendor: vendorId }).sort({
      voucherDate: 1,
      createdAt: 1,
      _id: 1,
    }),
  ]);

  if (!vendor) return null;

  const totalCredit = transactions
    .filter((entry) => entry.type === "opening" || entry.type === "purchase")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const totalDebit = transactions
    .filter((entry) => entry.type === "payment" || entry.type === "expense")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  vendor.dueAmount = Math.max(totalCredit - totalDebit, 0);
  await vendor.save();

  return {
    totalPurchase: totalCredit,
    totalPaid: totalDebit,
    outstandingBalance: vendor.dueAmount,
  };
};

export const buildVendorStatement = async (vendorId) => {
  await recalculateVendorLedger(vendorId);

  const [vendor, transactions] = await Promise.all([
    Vendor.findById(vendorId),
    VendorTransaction.find({ vendor: vendorId }).sort({
      voucherDate: 1,
      createdAt: 1,
      _id: 1,
    }),
  ]);

  if (!vendor) return null;

  let runningBalance = 0;
  const statement = transactions.map((entry) => {
    const isCredit = entry.type === "opening" || entry.type === "purchase";
    const credit = isCredit ? Number(entry.amount || 0) : 0;
    const debit = entry.type === "payment" || entry.type === "expense"
      ? Number(entry.amount || 0)
      : 0;

    runningBalance += credit - debit;

    return {
      _id: entry._id,
      date: entry.voucherDate || entry.createdAt,
      voucherType: entry.type,
      voucherNo: entry.voucherNo || "-",
      billNo: entry.billNo || "-",
      debit,
      credit,
      runningBalance: Math.max(runningBalance, 0),
      paymentMode: entry.paymentMode || "",
      remarks: entry.remarks || "",
    };
  });

  const totalPurchase = statement.reduce(
    (total, entry) => total + Number(entry.credit || 0),
    0
  );
  const totalPaid = statement.reduce(
    (total, entry) => total + Number(entry.debit || 0),
    0
  );

  return {
    vendor,
    summary: {
      totalPurchase,
      totalPaid,
      outstandingBalance: vendor.dueAmount,
    },
    statement,
  };
};
