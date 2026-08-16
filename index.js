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

const { startScheduler } = require("./utils/adScheduler");

connectDB().then(() => {
    startScheduler();
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("Backend running 1");
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


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});