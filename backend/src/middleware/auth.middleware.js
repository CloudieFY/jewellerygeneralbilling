import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Bearer token

    const jwtToken = token.split(" ")[1];

    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

    // Fetch user from DB to verify latest status and role
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Unauthorized User",
    });
  }
};

export default authMiddleware;