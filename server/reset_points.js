import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const resetPoints = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const result = await Member.updateMany({}, { totalPoints: 0 });
    console.log(`Successfully reset points for ${result.modifiedCount} members.`);
    process.exit();
  } catch (error) {
    console.error("Error resetting points:", error);
    process.exit(1);
  }
};

resetPoints();
