const express = require("express");
const { protectAdmin } = require("../middleware/adminMiddleware");
const {
    getDashboardStats,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get(
    "/stats",
    protectAdmin,
    getDashboardStats
);

module.exports = router;