/**
 * One-time fix script — mobileNumber_1 index drop
 * Run: node fix-mobile-index.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/billing";

async function fixIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB:", MONGO_URI);

    const db = mongoose.connection.db;
    const collection = db.collection("farmers");

    const indexes = await collection.indexes();
    console.log("\nExisting indexes on 'farmers':", indexes.map(i => i.name));

    const hasIndex = indexes.some(i => i.name === "mobileNumber_1");

    if (hasIndex) {
      await collection.dropIndex("mobileNumber_1");
      console.log("🗑️  Successfully dropped legacy mobileNumber_1 unique index!");
    } else {
      console.log("ℹ️  mobileNumber_1 index not found (already dropped).");
    }

    console.log("\n🎉 Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error dropping index:", error.message);
    process.exit(1);
  }
}

fixIndex();
