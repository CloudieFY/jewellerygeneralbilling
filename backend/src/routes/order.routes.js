import express from "express";
import { createOrder, getOrderDesign, getOrders, updateOrderStatus } from "../controllers/order.controller.js";

const router = express.Router();
router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id/design", getOrderDesign);
router.patch("/:id/status", updateOrderStatus);
export default router;
