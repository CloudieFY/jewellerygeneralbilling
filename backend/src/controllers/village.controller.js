import Farmer from "../models/Farmer.js";



// ================= GET ALL VILLAGES =================

export const getAllVillages = async (req, res) => {
  try {
    const villages = await Farmer.aggregate([
      {
        $group: {
          _id: "$village",

          farmerCount: {
            $sum: 1,
          },

          totalDueAmount: {
            $sum: "$dueAmount",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      totalVillages: villages.length,
      villages,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= GET FARMERS BY VILLAGE =================

export const getFarmersByVillage = async (req, res) => {
  try {
    const villageName = req.params.villageName;

    const farmers = await Farmer.find({
      village: villageName,
    });

    res.status(200).json({
      success: true,
      village: villageName,
      totalFarmers: farmers.length,
      farmers,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= SEARCH VILLAGE =================

export const searchVillage = async (req, res) => {
  try {
    const keyword = req.query.keyword;

    const villages = await Farmer.aggregate([
      {
        $match: {
          village: {
            $regex: keyword,
            $options: "i",
          },
        },
      },

      {
        $group: {
          _id: "$village",

          farmerCount: {
            $sum: 1,
          },

          totalDueAmount: {
            $sum: "$dueAmount",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      totalResults: villages.length,
      villages,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// ================= VILLAGE SUMMARY REPORT =================

export const villageSummaryReport = async (req, res) => {
  try {
    const report = await Farmer.aggregate([
      {
        $group: {
          _id: "$village",

          totalFarmers: {
            $sum: 1,
          },

          activeFarmers: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },

          inactiveFarmers: {
            $sum: {
              $cond: [{ $eq: ["$status", "inactive"] }, 1, 0],
            },
          },

          totalDueAmount: {
            $sum: "$dueAmount",
          },

          averageCreditLimit: {
            $avg: "$creditLimit",
          },
        },
      },

      {
        $sort: {
          totalDueAmount: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};