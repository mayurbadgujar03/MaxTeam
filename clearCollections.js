import mongoose from "mongoose";
import "dotenv/config";

const clearCollections = async () => {
    const mongoURI = process.env.DATABASE_URL || process.env.MONGO_URI;

    if (!mongoURI) {
        console.error("❌ Error: No database URL found in your .env file!");
        process.exit(1);
    }

    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("✅ Connected to MongoDB successfully.");

        // THE FIX: Use the native MongoDB driver to fetch the physical collections
        const collections = await mongoose.connection.db.collections();

        if (collections.length === 0) {
            console.log("⚠️ No collections found in the actual database.");
        }

        // Loop through every physical collection and empty the data natively
        for (let collection of collections) {
            console.log(`🧹 Emptying data from: ${collection.collectionName}...`);
            await collection.deleteMany({});
            // Structure, indexes, and schemas remain 100% safe.
        }

        console.log("🎉 SUCCESS: All collections have been emptied safely!");
        await mongoose.connection.close();
        console.log("🔌 Connection closed safely.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Production Safety Halt - Error clearing database:", error);
        process.exit(1);
    }
};

clearCollections();