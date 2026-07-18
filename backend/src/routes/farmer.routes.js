import express from "express";

import {
  addFarmer,
  getAllFarmers,
  getSingleFarmer,
  updateFarmer,
  deleteFarmer,
  searchFarmer,
} from "../controllers/farmer.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();



// add farmer

router.post("/", addFarmer);


// get all farmers

router.get("/", getAllFarmers);


// search farmer

router.get("/search", searchFarmer);


// single farmer

router.get("/:id", getSingleFarmer);


// update farmer

router.put("/:id", updateFarmer);


// delete farmer

router.delete("/:id", authMiddleware, deleteFarmer);

export default router;