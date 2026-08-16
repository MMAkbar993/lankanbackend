const express = require("express");

const {
    getAdminAds,
    updateAdStatus,
    updateAdType,
    updateAd,
} = require("../controllers/adminAdController");

const { protectAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", protectAdmin, getAdminAds);

router.patch("/:id/status", protectAdmin, updateAdStatus);
router.patch("/:id/type", protectAdmin, updateAdType);
router.patch("/:id", protectAdmin, updateAd);

module.exports = router;