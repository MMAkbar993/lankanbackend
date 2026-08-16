const User = require("../models/User");
const Ad = require("../models/Ad");
const Agent = require("../models/Agent");

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalAds, totalAgents] =
            await Promise.all([
                User.countDocuments(),
                Ad.countDocuments(),
                Agent.countDocuments(),
            ]);

        return res.status(200).json({
            totalUsers,
            totalAds,
            totalAgents,
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message,
        });
    }
};