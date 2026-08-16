const express = require("express");

const {
    createAd,
    getMyAds,
    updateAd,
    deleteAd,
    getPublicAds,
    getVipAds,
    getSuperAds,
    getNormalAds,
    toggleAdStatus,
    republishAd,
} = require("../controllers/adController");

const {
    toggleLike,
    toggleSave,
    getMySavedAds,
    incrementView,
} = require("../controllers/adInteractionController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const uploadSingleImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Image upload failed",
                error: error.message,
            });
        }

        next();
    });
};

router.post("/", protect, uploadSingleImage, createAd);

router.get("/my-ads", protect, getMyAds);
router.delete("/:id", protect, deleteAd);
router.patch("/:id", protect, uploadSingleImage, updateAd);
router.patch("/:id/toggle-status", protect, toggleAdStatus);
router.patch("/:id/republish", protect, republishAd);
router.get("/public", getPublicAds);

// separate home page APIs
router.get("/public/vip", getVipAds);
router.get("/public/super", getSuperAds);
router.get("/public/normal", getNormalAds);

router.post("/:id/toggle-like", protect, toggleLike);

router.post("/:id/toggle-save", protect, toggleSave);

router.get("/saved/my-ads", protect, getMySavedAds);
router.post("/:id/view", incrementView);

module.exports = router;