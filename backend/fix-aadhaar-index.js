/**
 * One-time fix script — aadhaarNumber_1 index drop + sparse re-create
 * Run: node fix-aadhaar-index.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/agroshop";

async function fixIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB:", MONGO_URI);

    const db = mongoose.connection.db;
    const collection = db.collection("farmers");

    // List existing indexes
    const indexes = await collection.indexes();
    console.log("\nExisting indexes:", indexes.map(i => i.name));

    // Drop the old aadhaarNumber_1 index if it exists
    const hasIndex = indexes.some(i => i.name === "aadhaarNumber_1");

    if (hasIndex) {
      await collection.dropIndex("aadhaarNumber_1");
      console.log("🗑️  Dropped old aadhaarNumber_1 index");
    } else {
      console.log("ℹ️  aadhaarNumber_1 index not found, skipping drop");
    }

    // Create new sparse unique index
    await collection.createIndex(
      { aadhaarNumber: 1 },
      { unique: true, sparse: true, name: "aadhaarNumber_1" }
    );
    console.log("✅ Created new sparse unique index on aadhaarNumber");

    console.log("\n🎉 Done! Backend restart karo ab.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixIndex();
