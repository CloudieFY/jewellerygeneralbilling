import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  getUsers,
  createUser,
  deleteUser,
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


// register

// router.post("/register", registerUser);


// login

router.post("/login", loginUser);


// profile

router.get("/profile", authMiddleware, getProfile);


// logout

router.get("/logout", authMiddleware, logoutUser);


// user list

router.get("/users", authMiddleware, getUsers);


// create user

router.post("/users", authMiddleware, createUser);


// delete user

router.delete("/users/:id", authMiddleware, deleteUser);

export default router;