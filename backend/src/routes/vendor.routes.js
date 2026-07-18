import express from "express";

import {
  createVendor,
  createExpensePayment,
  createVendorPayment,
  createVendorPurchase,
  deleteVendor,
  getAllVendors,
  getSingleVendor,
  getVendorLedger,
  getVendorTransactions,
  updateVendor,
} from "../controllers/vendor.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", createVendor);
router.get("/", getAllVendors);
router.get("/transactions", getVendorTransactions);
router.post("/purchase", createVendorPurchase);
router.post("/payment", createVendorPayment);
router.post("/expense", createExpensePayment);
router.get("/ledger/:id", getVendorLedger);
router.get("/:id", getSingleVendor);
router.put("/:id", updateVendor);
router.delete("/:id", authMiddleware, deleteVendor);

export default router;
