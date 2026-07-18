import express from "express";

import {
  createCreditTransaction,
  createPaymentTransaction,
  createInterestTransaction,
  getTransactionHistory,
  getFarmerLedger,
  searchTransactions,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();



// credit transaction

router.post("/credit", createCreditTransaction);



// payment transaction

router.post("/payment", createPaymentTransaction);



// interest transaction

router.post("/interest", createInterestTransaction);



// history

router.get("/history", getTransactionHistory);



// search & filter

router.get("/search", searchTransactions);



// farmer ledger

router.get("/ledger/:id", getFarmerLedger);



// delete transaction

router.delete("/:id", authMiddleware, deleteTransaction);

export default router;
