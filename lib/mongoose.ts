import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  // Ensure the MongoDB URL is present in the environment variables
  const mongoDBUrl = process.env.MONGODB_URL;
  if (!mongoDBUrl) {
    console.error("MONGODB_URL is not found in environment variables.");
    return;
  }

  if (isConnected) {
    console.log("Already connected to MongoDB.");
    return;
  }

  try {
    // Retry logic: Try connecting up to 3 times with a delay between attempts
    const connectWithRetry = async (retries = 3, delay = 5000) => {
      for (let i = 0; i < retries; i++) {
        try {
          await mongoose.connect(mongoDBUrl, {
            ssl: true, // Ensure SSL is used
            // Uncomment and add additional SSL options if necessary
            // sslCA: <path-to-ca-cert>,
            // sslCert: <path-to-cert>,
            // sslKey: <path-to-key>,
          });

          isConnected = true;
          console.log("Connected successfully to MongoDB.");
          return;
        } catch (error) {
          console.error(`Attempt ${i + 1} failed: ${error.message}`);
          if (i < retries - 1) {
            console.log(`Retrying in ${delay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            console.error("All connection attempts failed.");
            throw error;
          }
        }
      }
    };

    await connectWithRetry();

    // Monitor connection events
    mongoose.connection.on("connected", () => console.log("MongoDB connected"));
    mongoose.connection.on("disconnected", () =>
      console.log("MongoDB disconnected")
    );
    mongoose.connection.on("error", (err) =>
      console.error("MongoDB connection error:", err)
    );

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
