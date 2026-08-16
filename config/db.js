const mongoose = require("mongoose");

// Cached on `global` so a warm serverless instance (Vercel) reuses the same
// connection across invocations instead of reconnecting on every request.
let cachedPromise = global._mongoosePromise;

const connectDB = () => {
    if (!cachedPromise) {
        cachedPromise = mongoose
            .connect(process.env.MONGO_URI)
            .then((mongooseInstance) => {
                console.log("MongoDB connected");
                return mongooseInstance;
            })
            .catch((error) => {
                console.error("MongoDB connection failed:", error.message);
                cachedPromise = null;
                global._mongoosePromise = null;
                throw error;
            });

        global._mongoosePromise = cachedPromise;
    }

    return cachedPromise;
};

module.exports = connectDB;