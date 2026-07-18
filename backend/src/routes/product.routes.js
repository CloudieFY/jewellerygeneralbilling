import express from "express";

import {
  addProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  lowStockProducts,
  expiredProducts,
} from "../controllers/product.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();



// add product

router.post("/", addProduct);



// get all products

router.get("/", getAllProducts);



// search products

router.get("/search", searchProducts);



// low stock

router.get("/low-stock", lowStockProducts);



// expired products

router.get("/expired", expiredProducts);



// single product

router.get("/:id", getSingleProduct);



// update product

router.put("/:id", updateProduct);



// delete product

router.delete("/:id", authMiddleware, deleteProduct);

export default router;