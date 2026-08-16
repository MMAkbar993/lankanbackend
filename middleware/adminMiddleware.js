const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

exports.protectAdmin = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Admin token not found",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
        );

        const admin = await Admin.findById(decoded.adminId).select("-password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found",
            });
        }

        req.admin = admin;

        next();
    } catch (error) {
        console.error("Admin Middleware Error:", error);

        return res.status(401).json({
            success: false,
            message: "Admin token expired or invalid",
        });
    }
};