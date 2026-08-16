const express = require("express");
const { runScheduledJobs } = require("../utils/adScheduler");

const router = express.Router();

// Triggered on a schedule by Vercel Cron Jobs (see vercel.json). If
// CRON_SECRET is set in the environment, Vercel automatically sends it as
// `Authorization: Bearer <CRON_SECRET>` on cron-triggered requests.
router.get("/expire-ads", async (req, res) => {
    if (
        process.env.CRON_SECRET &&
        req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }

    try {
        await runScheduledJobs();

        return res.json({
            success: true,
            message: "Scheduled ad jobs completed",
        });
    } catch (error) {
        console.error("Cron expire-ads error:", error);

        return res.status(500).json({
            success: false,
            message: "Scheduled job failed",
            error: error.message,
        });
    }
});

module.exports = router;
