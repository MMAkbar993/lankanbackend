const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Otp = require("../models/Otp");
const sendSms = require("../utils/sendSms");

const router = express.Router();

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

// Send OTP
router.post("/send-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);

        await Otp.deleteMany({ phone });

        await Otp.create({
            phone,
            otp: hashedOtp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await sendSms({
            phone,
            message: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        });

        return res.json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("Send OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
        });
    }
});

// Verify OTP + Login/Register
router.post("/verify-otp", async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone and OTP are required",
            });
        }

        const otpDoc = await Otp.findOne({ phone });

        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request again.",
            });
        }

        if (otpDoc.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpDoc._id });

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request again.",
            });
        }

        const hashedInputOtp = hashOtp(otp);

        if (otpDoc.otp !== hashedInputOtp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        let user = await User.findOne({ phone });

        if (!user) {
            user = await User.create({
                phone,
                isVerified: true,
                lastLoginAt: new Date(),
            });
        } else {
            user.lastLoginAt = new Date();
            await user.save();
        }

        await Otp.deleteOne({ _id: otpDoc._id });

        const token = jwt.sign(
            {
                userId: user._id,
                phone: user.phone,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed",
        });
    }
});

module.exports = router;