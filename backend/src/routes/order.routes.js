import express from "express";
import { createOrder, getOrderDesign, getOrders, updateOrderStatus, deleteOrder } from "../controllers/order.controller.js";

const router = express.Router();
router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id/design", getOrderDesign);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);
export default router;
