import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not found in environment settings.");
    }
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const settingsList = await db.collection("settings").find({}).toArray();
    console.log("=== Settings in Database ===");
    console.log(JSON.stringify(settingsList, null, 2));
    console.log("============================");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
run();
