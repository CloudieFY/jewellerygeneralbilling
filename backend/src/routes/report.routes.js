import express from "express";

import {
  salesReport,
  farmerDueReport,
  stockReport,
  villageReport,
  chartAnalytics,
  dashboardSummary,
  outstandingReport,
  salesRegister,
  receiptRegister,
  purchaseRegister,
  paymentRegister,
  dayBook,
  cashBook,
} from "../controllers/report.controller.js";

const router = express.Router();



// sales report

router.get("/sales", salesReport);



// farmer due report

router.get("/farmer-due", farmerDueReport);



// stock report

router.get("/stock", stockReport);



// village report

router.get("/village", villageReport);



// chart analytics

router.get("/charts", chartAnalytics);



// dashboard summary

router.get("/dashboard", dashboardSummary);

router.get("/outstanding", outstandingReport);

router.get("/sales-register", salesRegister);

router.get("/receipt-register", receiptRegister);

router.get("/purchase-register", purchaseRegister);

router.get("/payment-register", paymentRegister);

router.get("/day-book", dayBook);

router.get("/cash-book", cashBook);

export default router;
