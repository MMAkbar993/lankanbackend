const express = require("express");
const { sendOtp, verifyOtp, changePhone } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.patch("/change-phone", protect, changePhone);

module.exports = router;