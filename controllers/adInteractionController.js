const Ad = require("../models/Ad");
const AdLike = require("../models/AdLike");
const SavedAd = require("../models/SavedAd");

exports.toggleLike = async (req, res) => {
    try {
        const adId = req.params.id;
        const userId = req.user._id;

        const ad = await Ad.findById(adId);

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: "Ad not found",
            });
        }

        const existingLike = await AdLike.findOne({
            user: userId,
            ad: adId,
        });

        if (existingLike) {
            await existingLike.deleteOne();

            const updatedAd = await Ad.findByIdAndUpdate(
                adId,
                { $inc: { likesCount: -1 } },
                { new: true }
            ).lean();

            return res.json({
                success: true,
                liked: false,
                likesCount: Math.max(updatedAd.likesCount || 0, 0),
                message: "Ad unliked",
            });
        }

        await AdLike.create({
            user: userId,
            ad: adId,
        });

        const updatedAd = await Ad.findByIdAndUpdate(
            adId,
            { $inc: { likesCount: 1 } },
            { new: true }
        ).lean();

        return res.json({
            success: true,
            liked: true,
            likesCount: updatedAd.likesCount || 0,
            message: "Ad liked",
        });
    } catch (error) {
        console.error("Toggle Like Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update like",
            error: error.message,
        });
    }
};

exports.toggleSave = async (req, res) => {
    try {
        const adId = req.params.id;
        const userId = req.user._id;

        const ad = await Ad.findById(adId);

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: "Ad not found",
            });
        }

        const existingSaved = await SavedAd.findOne({
            user: userId,
            ad: adId,
        });

        if (existingSaved) {
            await existingSaved.deleteOne();

            return res.json({
                success: true,
                saved: false,
                message: "Ad removed from saved list",
            });
        }

        await SavedAd.create({
            user: userId,
            ad: adId,
        });

        return res.json({
            success: true,
            saved: true,
            message: "Ad saved successfully",
        });
    } catch (error) {
        console.error("Toggle Save Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update saved ad",
            error: error.message,
        });
    }
};

exports.getMySavedAds = async (req, res) => {
    try {
        const userId = req.user._id;

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const filter = {
            user: userId,
        };

        const [savedItems, totalSaved] = await Promise.all([
            SavedAd.find(filter)
                .populate({
                    path: "ad",
                    match: { status: "approved" },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            SavedAd.countDocuments(filter),
        ]);

        const ads = savedItems
            .map((item) => item.ad)
            .filter(Boolean);

        const totalPages = Math.ceil(totalSaved / limit);

        return res.json({
            success: true,
            count: ads.length,
            page,
            limit,
            totalSaved,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            ads,
        });
    } catch (error) {
        console.error("Get Saved Ads Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get saved ads",
            error: error.message,
        });
    }
};

exports.incrementView = async (req, res) => {
    try {
        const adId = req.params.id;

        const ad = await Ad.findOneAndUpdate(
            {
                _id: adId,
                status: "approved",
            },
            {
                $inc: { viewsCount: 1 },
            },
            {
                new: true,
            }
        ).lean();

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: "Ad not found",
            });
        }

        return res.json({
            success: true,
            viewsCount: ad.viewsCount || 0,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update view count",
            error: error.message,
        });
    }
};