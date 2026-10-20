import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/bookleaf";
    if (!process.env.MONGODB_URL) {
      console.warn("⚠️ MONGODB_URL is not set in environment variables! In Render/Production, please add MONGODB_URL in your service Environment settings.");
    }
    const conn = await mongoose.connect(mongoUrl);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;