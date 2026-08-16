const cron = require("node-cron");
const Ad = require("../models/Ad");

// Job 1: Downgrade VIP/Super → Normal after 24 hours
const downgradeExpiredPremiumAds = async () => {
    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await Ad.updateMany(
            {
                status: "approved",
                type: { $in: ["VIP Ad", "Super Ad"] },
                approvedAt: { $lte: cutoff },
            },
            {
                $set: { type: "Normal Ad" },
            }
        );

        if (result.modifiedCount > 0) {
            console.log(
                `[Scheduler] Downgraded ${result.modifiedCount} premium ad(s) to Normal Ad`
            );
        }
    } catch (error) {
        console.error("[Scheduler] downgradeExpiredPremiumAds error:", error.message);
    }
};

// Job 2: Expire all ads after 30 days from approvedAt
const expireOldAds = async () => {
    try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Ad.updateMany(
            {
                status: "approved",
                approvedAt: { $lte: cutoff },
            },
            {
                $set: { status: "expired" },
            }
        );

        if (result.modifiedCount > 0) {
            console.log(
                `[Scheduler] Expired ${result.modifiedCount} ad(s) older than 30 days`
            );
        }
    } catch (error) {
        console.error("[Scheduler] expireOldAds error:", error.message);
    }
};

const startScheduler = () => {
    downgradeExpiredPremiumAds();
    expireOldAds();

    cron.schedule("0 * * * *", () => {
        downgradeExpiredPremiumAds();
        expireOldAds();
    });

    console.log("[Scheduler] Ad scheduler started");
};

module.exports = { startScheduler };