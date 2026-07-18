import Product from "../models/Product.js";

// ================= ADD PRODUCT =================

export const addProduct = async (req, res) => {
  try {
    const {
      productName,
      category,
      unit,
      hsnCode,
      quantity,
      purchasePrice,
      creditRate,
      cashRate,
      wholesaleRate,
      gstRate,
      expiryDate,
      lowStockThreshold,
      status,
      description,
      sku, metalType, purity, fineness, huid, hallmarked, grossWeight,
      netWeight, stoneWeight, pieces, metalRatePerGram, wastagePercent,
      makingChargeType, makingCharge, stoneValue,
    } = req.body;

    // validation

    if (
      !productName ||
      !category
    ) {
      return res.status(400).json({
        message: "All required fields are required",
      });
    }

    // duplicate check

    const existingProduct = await Product.findOne({
      productName: productName.toLowerCase().trim(),
      category: category.toLowerCase().trim(),
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product already exists",
      });
    }

    // stock status

    let productStatus = status || "available";

    // create product

    const product = await Product.create({
      productName: productName.toLowerCase().trim(),
      category: category.toLowerCase().trim(),
      unit,
      hsnCode,
      quantity: quantity ?? 0,
      purchasePrice: purchasePrice ?? 0,
      creditRate,
      cashRate,
      wholesaleRate,
      gstRate,
      expiryDate,
      lowStockThreshold,
      status: productStatus,
      description,
      sku, metalType, purity, fineness, huid, hallmarked,
      grossWeight: grossWeight ?? 0,
      netWeight: netWeight ?? 0,
      stoneWeight: stoneWeight ?? 0,
      pieces: pieces ?? 1,
      metalRatePerGram: metalRatePerGram ?? 0,
      wastagePercent: wastagePercent ?? 0,
      makingChargeType,
      makingCharge: makingCharge ?? 0,
      stoneValue: stoneValue ?? 0,
    });

    res.status(201).json({
      success: true,
      message: "Product Added Successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL PRODUCTS =================

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET SINGLE PRODUCT =================

export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= UPDATE PRODUCT =================

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // update stock status

    if (req.body.quantity !== undefined && req.body.status === undefined) {
      req.body.status = req.body.quantity <= 0 ? "out_of_stock" : "available";
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after",
      }
    );

    res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= DELETE PRODUCT =================

export const deleteProduct = async (req, res) => {
  try {
    if (req.user && req.user.role === "operator") {
      return res.status(403).json({
        message: "Forbidden: Operator cannot delete product records",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= SEARCH PRODUCTS =================

export const searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword;

    const products = await Product.find({
      $or: [
        {
          productName: {
            $regex: keyword,
            $options: "i",
          },
        },

        {
          category: {
            $regex: keyword,
            $options: "i",
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      totalResults: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= LOW STOCK PRODUCTS =================

export const lowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ["$quantity", "$lowStockThreshold"],
      },
    });

    res.status(200).json({
      success: true,
      totalLowStockProducts: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= EXPIRED PRODUCTS =================

export const expiredProducts = async (req, res) => {
  try {
    const today = new Date();

    const products = await Product.find({
      expiryDate: {
        $lt: today,
      },
    });

    res.status(200).json({
      success: true,
      totalExpiredProducts: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
