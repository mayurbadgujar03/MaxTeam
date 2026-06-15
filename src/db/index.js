import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error("Mongodb connection failed", error);
    throw error;
  }
};

export default connectDB;
