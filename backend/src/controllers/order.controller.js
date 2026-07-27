import Farmer from "../models/Farmer.js";
import Order from "../models/Order.js";

const nextOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `JOB-${year}-`;
  const last = await Order.findOne({ orderNumber: { $regex: `^${prefix}` } })
    .sort({ orderNumber: -1 })
    .select("orderNumber");
  const sequence = Number(last?.orderNumber?.split("-").pop() || 0) + 1;
  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

export const createOrder = async (req, res) => {
  try {
    const {
      customerId, customerName, customerMobile, customerAddress = "",
      itemDescription, metal, purity, fixedRate, advancePaid = 0,
      orderDate, dueDate, note = "", design,
    } = req.body;

    if (!customerName || !itemDescription || !metal || !purity || !orderDate || !dueDate) {
      return res.status(400).json({ message: "Please complete all required order fields" });
    }
    const hasFixedRate = fixedRate !== undefined && fixedRate !== null && fixedRate !== "";
    if ((hasFixedRate && Number(fixedRate) < 0) || Number(advancePaid) < 0) {
      return res.status(400).json({ message: "Rate and advance cannot be negative" });
    }
    if (new Date(dueDate) < new Date(orderDate)) {
      return res.status(400).json({ message: "Due date cannot be before order date" });
    }
    if (design?.data?.length > 8_000_000) {
      return res.status(400).json({ message: "Design file is too large. Maximum size is 5 MB" });
    }

    const trimmedCustomerMobile = typeof customerMobile === "string" ? customerMobile.trim() : "";

    let customer = customerId ? await Farmer.findById(customerId) : null;
    if (!customer && trimmedCustomerMobile) customer = await Farmer.findOne({ mobileNumber: trimmedCustomerMobile });
    if (!customer) {
      customer = await Farmer.create({
        name: customerName,
        mobileNumber: trimmedCustomerMobile,
        address: customerAddress,
      });
    } else {
      customer.name = customerName;
      customer.mobileNumber = trimmedCustomerMobile;
      customer.address = customerAddress;
      await customer.save();
    }

    const order = await Order.create({
      orderNumber: await nextOrderNumber(), customer: customer._id,
      customerName, customerMobile: trimmedCustomerMobile, customerAddress,
      itemDescription, metal, purity, fixedRate: hasFixedRate ? Number(fixedRate) : null,
      advancePaid: Number(advancePaid), orderDate, dueDate, note,
      design: design || undefined,
    });

    const savedOrder = order.toObject();
    savedOrder.designAttached = Boolean(savedOrder.design?.data);
    if (savedOrder.design) savedOrder.design.data = "";
    res.status(201).json({ success: true, message: "Order saved successfully", order: savedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find()
      .select("-design.data")
      .populate("customer", "name mobileNumber address")
      .sort({ createdAt: -1 })
      .lean();
    orders.forEach((order) => {
      order.designAttached = Boolean(order.design?.name);
    });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderDesign = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select("design").lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.design?.data) return res.status(404).json({ message: "No design attached" });
    res.json({ success: true, design: order.design });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { returnDocument: "after", runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
