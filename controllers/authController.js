const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Otp = require("../models/Otp");
const Counter = require("../models/Counter");
const sendSms = require("../utils/sendSms");

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateAccountId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "userAccountId" },
        { $inc: { seq: 1 } },
        {
            new: true,
            upsert: true,
        }
    );

    return `LA${counter.seq}`;
};

exports.sendOtp = async (req, res) => {
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

        const smsResponse = await sendSms({
            phone,
            message: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        });

        return res.json({
            success: true,
            message: "OTP sent successfully",
            sms: smsResponse,
        });
    } catch (error) {
        console.error("Send OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            reason: error.message,
            providerStatusCode: error.statusCode || null,
            providerResponse: error.providerResponse || null,
        });
    }
};
// exports.sendOtp = async (req, res) => {
//     try {
//         const { phone } = req.body;

//         if (!phone) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Phone number is required",
//             });
//         }

//         const isDev = true;
//         const otp = isDev ? "123456" : generateOtp();
//         const hashedOtp = hashOtp(otp);

//         await Otp.deleteMany({ phone });

//         await Otp.create({
//             phone,
//             otp: hashedOtp,
//             expiresAt: new Date(Date.now() + 5 * 60 * 1000),
//         });

//         if (!isDev) {
//             await sendSms({
//                 phone,
//                 message: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
//             });
//         }

//         return res.json({
//             success: true,
//             message: isDev ? "DEV MODE: OTP is 123456" : "OTP sent successfully",
//         });
//     } catch (error) {
//         console.error("Send OTP error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to send OTP",
//             reason: error.message,
//         });
//     }
// };
exports.changePhone = async (req, res) => {
    try {
        const { newPhone, otp } = req.body;

        if (!newPhone || !otp) {
            return res.status(400).json({
                success: false,
                message: "New phone number and OTP are required",
            });
        }

        const otpDoc = await Otp.findOne({ phone: newPhone });

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

        const existingUser = await User.findOne({ phone: newPhone });

        if (existingUser && !existingUser._id.equals(req.user._id)) {
            return res.status(409).json({
                success: false,
                message: "This phone number is already in use by another account",
            });
        }

        req.user.phone = newPhone;
        await req.user.save();

        await Otp.deleteOne({ _id: otpDoc._id });

        return res.json({
            success: true,
            message: "Phone number updated successfully",
            user: req.user,
        });
    } catch (error) {
        console.error("Change Phone error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change phone number",
            error: error.message,
        });
    }
};

exports.verifyOtp = async (req, res) => {
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
            const accountId = await generateAccountId();

            user = await User.create({
                accountId,
                phone,
                isVerified: true,
                lastLoginAt: new Date(),
            });
        } else {
            if (!user.accountId) {
                user.accountId = await generateAccountId();
            }

            user.lastLoginAt = new Date();
            await user.save();
        }

        await Otp.deleteOne({ _id: otpDoc._id });

        const token = jwt.sign(
            {
                userId: user._id,
                accountId: user.accountId,
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
            error: error.message,
        });
    }
};