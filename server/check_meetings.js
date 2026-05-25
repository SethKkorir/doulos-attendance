import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://zsethkipchumba179_db_user:kipchumba@doulos.ypnrghc.mongodb.net/';

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("\nCollections and Document Counts:");
    for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`- ${coll.name}: ${count} documents`);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
}

run().catch(console.error);
