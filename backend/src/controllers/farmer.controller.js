import Farmer from "../models/Farmer.js";
import Invoice from "../models/Invoice.js";
import Transaction from "../models/Transaction.js";
import { recalculateCustomerLedger } from "../utils/customerLedger.js";
import { generateCustomerVoucherNumber } from "../utils/voucherNumber.js";

const upsertOpeningBalance = async (farmerId, openingBalance = 0) => {
  const amount = Number(openingBalance) || 0;
  const existing = await Transaction.findOne({
    farmer: farmerId,
    type: "opening",
  });

  if (amount <= 0) {
    if (existing) {
      await Transaction.findByIdAndDelete(existing._id);
    }
    return;
  }

  if (existing) {
    existing.amount = amount;
    existing.description = "Opening Balance";
    existing.voucherNo = existing.voucherNo || await generateCustomerVoucherNumber("opening");
    existing.voucherDate = existing.voucherDate || new Date();
    await existing.save();
    return;
  }

  await Transaction.create({
    farmer: farmerId,
    type: "opening",
    amount,
    voucherNo: await generateCustomerVoucherNumber("opening"),
    voucherDate: new Date(),
    description: "Opening Balance",
  });
};

const attachCustomerStats = async (farmer) => {
  const [invoices, payments] = await Promise.all([
    Invoice.find({ farmer: farmer._id }).select("grandTotal"),
    Transaction.find({ farmer: farmer._id, type: "payment" }).select("amount"),
  ]);

  const data = farmer.toObject ? farmer.toObject() : farmer;

  return {
    ...data,
    totalOrders: invoices.length,
    totalPurchase: invoices.reduce(
      (total, invoice) => total + Number(invoice.grandTotal || 0),
      0
    ),
    totalPaid: payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    ),
    outstandingBalance: Number(data.dueAmount || 0),
  };
};

// ================= ADD FARMER =================

export const addFarmer = async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      village = "",
      city = "",
      address = "",
      aadhaarNumber,
      gstNumber,
      openingBalance = 0,
      creditLimit = 0,
      paymentTerms = "",
      defaultRateType,
      status = "active",
    } = req.body;

    // validation

    if (!name || !mobileNumber) {
      return res.status(400).json({
        message: "Customer name and mobile are required",
      });
    }

    // check existing customer

    const existingFarmer = await Farmer.findOne({ mobileNumber });

    if (existingFarmer) {
      return res.status(400).json({
        message: "Customer already exists",
      });
    }

    // create farmer

    const trimmedAadhaar =
      typeof aadhaarNumber === "string" ? aadhaarNumber.trim() : aadhaarNumber;

    const farmer = await Farmer.create({
      name,
      mobileNumber,
      village,
      city,
      address,
      aadhaarNumber: trimmedAadhaar || undefined,
      gstNumber,
      openingBalance: Number(openingBalance) || 0,
      creditLimit,
      paymentTerms,
      defaultRateType: defaultRateType || "Rate A",
      status,
    });

    await upsertOpeningBalance(farmer._id, openingBalance);
    await recalculateCustomerLedger(farmer._id);

    res.status(201).json({
      success: true,
      message: "Customer Added Successfully",
      farmer,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET ALL FARMERS =================

export const getAllFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find().sort({ createdAt: -1 });
    const farmersWithStats = await Promise.all(farmers.map(attachCustomerStats));

    res.status(200).json({
      success: true,
      totalFarmers: farmersWithStats.length,
      farmers: farmersWithStats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET SINGLE FARMER =================

export const getSingleFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    const farmerWithStats = await attachCustomerStats(farmer);

    res.status(200).json({
      success: true,
      farmer: farmerWithStats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= UPDATE FARMER =================

export const updateFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    const { aadhaarNumber, ...restBody } = req.body;
    const updatePayload = { $set: restBody };

    if (Object.prototype.hasOwnProperty.call(req.body, "aadhaarNumber")) {
      const trimmedAadhaar =
        typeof aadhaarNumber === "string" ? aadhaarNumber.trim() : aadhaarNumber;

      if (trimmedAadhaar) {
        updatePayload.$set.aadhaarNumber = trimmedAadhaar;
      } else {
        updatePayload.$unset = { aadhaarNumber: "" };
      }
    }

    const updatedFarmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      {
        returnDocument: "after",
      }
    );

    if (Object.prototype.hasOwnProperty.call(req.body, "openingBalance")) {
      await upsertOpeningBalance(
        updatedFarmer._id,
        updatedFarmer.openingBalance
      );
      await recalculateCustomerLedger(updatedFarmer._id);
    }

    res.status(200).json({
      success: true,
      message: "Farmer Updated Successfully",
      updatedFarmer,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= DELETE FARMER =================

export const deleteFarmer = async (req, res) => {
  try {
    if (req.user && req.user.role === "operator") {
      return res.status(403).json({
        message: "Forbidden: Operator cannot delete customer records",
      });
    }

    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    await Farmer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Farmer Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= SEARCH FARMER =================

export const searchFarmer = async (req, res) => {
  try {
    const keyword = req.query.keyword;

    const farmers = await Farmer.find({
      $or: [
        {
          name: { $regex: keyword, $options: "i" },
        },
        {
          village: { $regex: keyword, $options: "i" },
        },
        {
          mobileNumber: { $regex: keyword, $options: "i" },
        },
      ],
    });
    const farmersWithStats = await Promise.all(farmers.map(attachCustomerStats));

    res.status(200).json({
      success: true,
      totalResults: farmersWithStats.length,
      farmers: farmersWithStats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
