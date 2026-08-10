import Settings from "../models/Settings.js";
import Invoice from "../models/Invoice.js";

// ================= GET SETTINGS =================

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const activeFilter = {
      isDeleted: { $ne: true },
      deleted: { $ne: true },
      status: { $ne: "deleted" },
    };

    const [activeGstInvoicesCount, activeOrdersCount] = await Promise.all([
      Invoice.countDocuments({ ...activeFilter, documentType: { $ne: "order" } }),
      Invoice.countDocuments({ ...activeFilter, documentType: "order" }),
    ]);

    const settingsObj = settings.toObject();
    settingsObj.gstInvoiceCounter = activeGstInvoicesCount;
    settingsObj.orderCounter = activeOrdersCount;

    res.status(200).json({
      success: true,
      settings: settingsObj,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= UPDATE SETTINGS =================

export const updateSettings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: Only Admin can update settings",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const protectedFields = ["gstInvoiceCounter", "orderCounter"];

    // update all fields dynamically except sequence counters
    Object.keys(req.body).forEach((key) => {
      if (!protectedFields.includes(key)) {
        settings[key] = req.body[key];
      }
    });

    await settings.save();

    const activeFilter = {
      isDeleted: { $ne: true },
      deleted: { $ne: true },
      status: { $ne: "deleted" },
    };

    const [activeGstInvoicesCount, activeOrdersCount] = await Promise.all([
      Invoice.countDocuments({ ...activeFilter, documentType: { $ne: "order" } }),
      Invoice.countDocuments({ ...activeFilter, documentType: "order" }),
    ]);

    const settingsObj = settings.toObject();
    settingsObj.gstInvoiceCounter = activeGstInvoicesCount;
    settingsObj.orderCounter = activeOrdersCount;

    res.status(200).json({
      success: true,
      message: "Settings Updated Successfully",
      settings: settingsObj,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};