import express from "express";

import {
  getAllVillages,
  getFarmersByVillage,
  searchVillage,
  villageSummaryReport,
} from "../controllers/village.controller.js";

const router = express.Router();



// all villages

router.get("/", getAllVillages);



// search village

router.get("/search", searchVillage);



// summary report

router.get("/report/summary", villageSummaryReport);



// farmers by village

router.get("/:villageName/farmers", getFarmersByVillage);

export default router;