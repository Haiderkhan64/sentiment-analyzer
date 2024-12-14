import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
    mongoose.set("strictQuery", true);

    if (!process.env.MONGODB_URL) {
        console.error("MONGODB_URL is not found in environment variables.");
        return;
    }

    if (isConnected) {
        console.log("Already connected to MongoDB.");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;
        console.log("Connected successfully to MongoDB.");

        // Monitor connection events
        mongoose.connection.on('connected', () => console.log('MongoDB connected'));
        mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
        mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));

        // Handle app termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

