const Ad = require("../models/Ad");

const allowedStatus = ["pending", "approved", "rejected"];

const getAllowedTypes = () => {
    return Ad.schema.path("type").enumValues;
};

exports.getAdminAds = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const search = req.query.search?.trim() || "";
        const category = req.query.category?.trim() || "";
        const status = req.query.status?.trim() || "";

        const filter = {};

        if (status) filter.status = status;

        if (category) {
            filter.category = { $regex: category, $options: "i" };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { adId: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },           
                { whatsappNumber: { $regex: search, $options: "i" } }, 
            ];
        }

        const [ads, total] = await Promise.all([
            Ad.find(filter)
                .populate("user", "accountId phone name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Ad.countDocuments(filter),
        ]);

        const pages = Math.ceil(total / limit) || 1;
        const adTypes = getAllowedTypes();

        return res.status(200).json({
            success: true,
            ads,
            total,
            page,
            pages,
            adTypes,
        });
    } catch (error) {
        console.error("Get Admin Ads Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch ads",
            error: error.message,
        });
    }
};

exports.updateAdStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ad status",
            });
        }

        const updateData = { status };

        if (status === "approved") {
            const now = new Date();
            updateData.approvedAt = now;
            updateData.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
        }

        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate("user", "accountId phone name email")
            .lean();

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: "Ad not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ad status updated successfully",
            ad,
        });
    } catch (error) {
        console.error("Update Ad Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update ad status",
            error: error.message,
        });
    }
};

exports.updateAdType = async (req, res) => {
    try {
        const { type } = req.body;
        const allowedTypes = getAllowedTypes();

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ad type",
            });
        }

        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            { type },
            { new: true, runValidators: true }
        )
            .populate("user", "accountId phone name email")
            .lean();

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: "Ad not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ad type updated successfully",
            ad,
        });
    } catch (error) {
        console.error("Update Ad Type Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update ad type",
            error: error.message,
        });
    }
};

exports.updateAd = async (req, res) => {
    try {
        const { status, type } = req.body;

        const updateData = {};
        const allowedTypes = getAllowedTypes();

        if (status) {
            if (!allowedStatus.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ad status",
                });
            }

            updateData.status = status;
        }

        if (type) {
            if (!allowedTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ad type",
                });
            }

            updateData.type = type;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No update data provided",
            });
        }

        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate("user", "accountId phone name email")
            .lean();

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: "Ad not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ad updated successfully",
            ad,
        });
    } catch (error) {
        console.error("Update Ad Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update ad",
            error: error.message,
        });
    }
};