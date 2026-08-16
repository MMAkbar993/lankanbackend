const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const createToken = (admin) => {
    return jwt.sign(
        {
            adminId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
        },
        process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.ADMIN_JWT_EXPIRES_IN ||
                process.env.JWT_EXPIRES_IN ||
                "7d",
        }
    );
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const admin = await Admin.findOne({
            email: email.toLowerCase(),
        }).select("+password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isPasswordMatched = await admin.comparePassword(password);

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = createToken(admin);

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,

            debug: {
                adminId: admin._id,
            },

            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
            },
        });
    } catch (error) {
        console.error("Admin Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Admin login failed",
            error: error.message,
        });
    }
};

exports.adminLogout = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Admin logout successful",
    });
};