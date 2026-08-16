require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adRoutes = require("./routes/adRoutes");
const agentRoutes = require("./routes/agentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAgentRoutes = require("./routes/adminAgentRoutes");
const adminAdRoutes = require("./routes/adminAdRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const cronRoutes = require("./routes/cronRoutes");

const { startScheduler } = require("./utils/adScheduler");

// Vercel sets this automatically at runtime.
const isVercel = !!process.env.VERCEL;

connectDB().catch((error) => {
    console.error("Initial MongoDB connection failed:", error.message);
});

if (!isVercel) {
    // node-cron needs a long-running process to fire on schedule, which
    // Vercel's serverless functions don't provide. On Vercel, the same jobs
    // run instead via a Vercel Cron Job hitting /api/cron/expire-ads.
    startScheduler();
}

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("Backend running 1");
});

// Ensures the (cached) DB connection is ready before any route runs a
// query — matters most on a cold serverless start.
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(503).json({
            success: false,
            message: "Database unavailable",
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/agents", agentRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/agents", adminAgentRoutes);
app.use("/admin/ads", adminAdRoutes);
app.use("/admin/dashboard", adminDashboardRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/admin', adminUserRoutes);
app.use("/api/cron", cronRoutes);

const PORT = process.env.PORT || 5000;

if (!isVercel) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;