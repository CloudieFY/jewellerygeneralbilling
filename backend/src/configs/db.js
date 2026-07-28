import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Auto-cleanup: Drop legacy unique index on mobileNumber if it exists in MongoDB
    try {
      const farmersCollection = mongoose.connection.db.collection("farmers");
      const indexes = await farmersCollection.indexes();
      if (indexes.some((idx) => idx.name === "mobileNumber_1")) {
        await farmersCollection.dropIndex("mobileNumber_1");
        console.log("Cleared legacy unique index 'mobileNumber_1' from farmers collection.");
      }
    } catch (_indexErr) {
      // Ignore if collection doesn't exist yet
    }
  } catch (error) {
    console.log("Database Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;