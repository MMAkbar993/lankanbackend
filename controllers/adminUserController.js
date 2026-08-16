const mongoose = require("mongoose");
const User = require("../models/User");

const PUBLIC_FIELDS =
    "accountId name phone isVerified lastLoginAt createdAt updatedAt";

/**
 * @desc    Get all users (paginated + searchable)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );
        const search = (req.query.search || "").trim();

        const filter = {};

        if (search) {
            const safe = search.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
            const regex = new RegExp(safe, "i");

            filter.$or = [
                { name: regex },
                { phone: regex },
                { accountId: regex },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(PUBLIC_FIELDS)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            users,
            total,
            page,
            limit,
            pages: Math.max(1, Math.ceil(total / limit)),
        });
    } catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

/**
 * @desc    Get single user by id
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const user = await User.findById(id).select(PUBLIC_FIELDS).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("getUserById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
};