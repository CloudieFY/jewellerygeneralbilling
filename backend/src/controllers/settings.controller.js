import Settings from "../models/Settings.js";



// ================= GET SETTINGS =================

export const getSettings = async (req, res) => {
  try {

    let settings =
      await Settings.findOne();

    // create default settings

    if (!settings) {

      settings =
        await Settings.create({});
    }



    res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};



// ================= UPDATE SETTINGS =================

export const updateSettings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: Only Admin can update settings",
      });
    }

    let settings =
      await Settings.findOne();

    // create settings if not exists

    if (!settings) {

      settings =
        await Settings.create({});
    }



    // update all fields dynamically

    Object.keys(req.body).forEach((key) => {

      settings[key] = req.body[key];

    });



    await settings.save();



    res.status(200).json({
      success: true,

      message:
        "Settings Updated Successfully",

      settings,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};