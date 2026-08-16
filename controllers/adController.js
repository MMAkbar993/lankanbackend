const Ad = require("../models/Ad");
const Counter = require("../models/Counter");
const { uploadBuffer, destroy } = require("../utils/cloudinaryUpload");

const generateAdId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "adId" },
    { $inc: { seq: 1 } },
    {
      returnDocument: "after",
      upsert: true,
    }
  );

  return `AD${counter.seq}`;
};

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildAdFields = (req, adId, image) => {
  const {
    type,
    title,
    category,
    location,
    price,
    description,
    phone,
    whatsappNumber,
    whatsapp,
    telegram,
    imo,
    viber,
  } = req.body;

  return {
    user: req.user._id,
    adId,
    image,
    type: type || "Super Ad",
    title,
    category,
    location,
    price: Number(price),
    description,
    phone: phone || "",
    whatsappNumber: whatsappNumber || "",
    socialAvailability: {
      whatsapp: whatsapp === "true" || whatsapp === true,
      telegram: telegram === "true" || telegram === true,
      imo: imo === "true" || imo === true,
      viber: viber === "true" || viber === true,
    },
    status: "pending",
  };
};

exports.createAd = async (req, res) => {
  try {
    const { title, category, location, price, description } = req.body;

    if (!title || !category || !location || !price || !description) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    let image = { url: "", filename: "" };

    if (req.file) {
      try {
        const result = await uploadBuffer(req.file.buffer, {
          folder: "lanka-ads/ads",
        });

        image = {
          url: result.secure_url,
          filename: result.public_id,
        };
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);

        return res.status(502).json({
          success: false,
          message: "Image upload failed. Please try again.",
        });
      }
    }

    const adId = await generateAdId();

    let ad;
    try {
      ad = await Ad.create(buildAdFields(req, adId, image));
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.adId) {
        const retryAdId = await generateAdId();
        ad = await Ad.create(buildAdFields(req, retryAdId, image));
      } else {
        throw err;
      }
    }

    const populatedAd = await Ad.findById(ad._id).populate(
      "user",
      "accountId phone name"
    );

    return res.status(201).json({
      success: true,
      message: "Ad created successfully",
      ad: populatedAd,
    });
  } catch (error) {
    console.error("Create Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ad",
      error: error.message,
    });
  }
};

exports.getMyAds = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

    const filter = {
      user: req.user._id,
    };

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
        { adId: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [ads, totalAds] = await Promise.all([
      Ad.find(filter)
        .populate("user", "accountId phone name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Ad.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalAds / limit);

    return res.json({
      success: true,
      count: ads.length,
      page,
      limit,
      search,
      totalAds,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      ads,
    });
  } catch (error) {
    console.error("Get My Ads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get ads",
      error: error.message,
    });
  }
};

exports.getPublicAds = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const SUPER_LIMIT = 80;
    const NORMAL_LIMIT = 10;

    const category = req.query.category?.trim() || "";
    const location = req.query.location?.trim() || "";
    const search = req.query.search?.trim() || "";
    const typeFilter = req.query.type?.trim() || "";
    const now = new Date();

    const baseFilter = {
      status: "approved",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };

    if (category) {
      baseFilter.category = {
        $regex: `^${escapeRegex(category)}$`,
        $options: "i",
      };
    }

    if (location) {
      baseFilter.location = { $regex: escapeRegex(location), $options: "i" };
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      baseFilter.$and = [
        {
          $or: [
            { title: { $regex: safeSearch, $options: "i" } },
            { category: { $regex: safeSearch, $options: "i" } },
            { location: { $regex: safeSearch, $options: "i" } },
            { adId: { $regex: safeSearch, $options: "i" } },
            { description: { $regex: safeSearch, $options: "i" } },
          ],
        },
      ];
    }

    const sortOrder = { approvedAt: -1, createdAt: -1 };

    if (typeFilter) {
      const LIMIT = 20;
      const skip = (page - 1) * LIMIT;

      const singleTypeFilter = {
        ...baseFilter,
        type: { $regex: `^${escapeRegex(typeFilter)}$`, $options: "i" },
      };

      const [ads, totalAds] = await Promise.all([
        Ad.find(singleTypeFilter)
          .populate("user", "accountId phone name")
          .sort(sortOrder)
          .skip(skip)
          .limit(LIMIT)
          .lean(),
        Ad.countDocuments(singleTypeFilter),
      ]);

      const totalPages = Math.ceil(totalAds / LIMIT) || 1;

      return res.status(200).json({
        success: true,
        count: ads.length,
        page,
        totalAds,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        search,
        category,
        location,
        type: typeFilter,
        ads,
      });
    }

    const vipFilter = {
      ...baseFilter,
      type: { $regex: "^VIP Ad$", $options: "i" },
    };
    const superFilter = {
      ...baseFilter,
      type: { $regex: "^Super Ad$", $options: "i" },
    };
    const normalFilter = {
      ...baseFilter,
      type: { $regex: "^Normal Ad$", $options: "i" },
    };

    const superSkip = (page - 1) * SUPER_LIMIT;
    const normalSkip = (page - 1) * NORMAL_LIMIT;

    let ads = [];
    let totalSuperAds = 0;
    let totalNormalAds = 0;
    let totalVipAds = 0;

    if (page === 1) {
      const [vipAds, superAds, normalAds, totalSuper, totalNormal, totalVip] =
        await Promise.all([
          Ad.find(vipFilter)
            .populate("user", "accountId phone name")
            .sort(sortOrder),
          Ad.find(superFilter)
            .populate("user", "accountId phone name")
            .sort(sortOrder)
            .skip(0)
            .limit(SUPER_LIMIT),
          Ad.find(normalFilter)
            .populate("user", "accountId phone name")
            .sort(sortOrder)
            .skip(0)
            .limit(NORMAL_LIMIT),
          Ad.countDocuments(superFilter),
          Ad.countDocuments(normalFilter),
          Ad.countDocuments(vipFilter),
        ]);

      ads = [...vipAds, ...superAds, ...normalAds];
      totalSuperAds = totalSuper;
      totalNormalAds = totalNormal;
      totalVipAds = totalVip;
    } else {
      const [superAds, normalAds, totalSuper, totalNormal, totalVip] =
        await Promise.all([
          Ad.find(superFilter)
            .populate("user", "accountId phone name")
            .sort(sortOrder)
            .skip(superSkip)
            .limit(SUPER_LIMIT),
          Ad.find(normalFilter)
            .populate("user", "accountId phone name")
            .sort(sortOrder)
            .skip(normalSkip)
            .limit(NORMAL_LIMIT),
          Ad.countDocuments(superFilter),
          Ad.countDocuments(normalFilter),
          Ad.countDocuments(vipFilter),
        ]);

      ads = [...superAds, ...normalAds];
      totalSuperAds = totalSuper;
      totalNormalAds = totalNormal;
      totalVipAds = totalVip;
    }

    const totalPages = Math.max(
      Math.ceil(totalSuperAds / SUPER_LIMIT) || 0,
      Math.ceil(totalNormalAds / NORMAL_LIMIT) || 0,
      1
    );

    const totalAds = totalVipAds + totalSuperAds + totalNormalAds;

    return res.status(200).json({
      success: true,
      count: ads.length,
      page,
      totalAds,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      search,
      category,
      location,
      ads,
    });
  } catch (error) {
    console.error("Get Public Ads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get public ads",
      error: error.message,
    });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    const publicId = ad.image?.filename;
    const isCloudinary = ad.image?.url?.startsWith("http");

    if (publicId && isCloudinary) {
      try {
        await destroy(publicId);
      } catch (destroyError) {
        console.error("Cloudinary Destroy Error:", destroyError);
      }
    }

    await ad.deleteOne();

    return res.json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("Delete Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete ad",
      error: error.message,
    });
  }
};

exports.toggleAdStatus = async (req, res) => {
  try {
    const ad = await Ad.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    if (ad.status === "approved") {
      ad.status = "inactive";
    } else if (ad.status === "inactive") {
      ad.status = "approved";
    } else {
      return res.status(400).json({
        success: false,
        message: "Only approved or inactive ads can be paused or resumed",
      });
    }

    await ad.save();

    const populatedAd = await Ad.findById(ad._id).populate(
      "user",
      "accountId phone name"
    );

    return res.status(200).json({
      success: true,
      message:
        ad.status === "inactive"
          ? "Ad paused successfully"
          : "Ad resumed successfully",
      ad: populatedAd,
    });
  } catch (error) {
    console.error("Toggle Ad Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ad status",
      error: error.message,
    });
  }
};

const REPUBLISH_TYPES = ["VIP Ad", "Super Ad", "Normal Ad"];

exports.republishAd = async (req, res) => {
  try {
    const { type } = req.body;

    if (!REPUBLISH_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type must be one of: ${REPUBLISH_TYPES.join(", ")}`,
      });
    }

    const ad = await Ad.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    if (ad.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Ad is already pending review",
      });
    }

    ad.status = "pending";
    ad.type = type;
    ad.approvedAt = null;
    ad.expiresAt = null;

    await ad.save();

    const populatedAd = await Ad.findById(ad._id).populate(
      "user",
      "accountId phone name"
    );

    return res.status(200).json({
      success: true,
      message: "Ad submitted for republishing",
      ad: populatedAd,
    });
  } catch (error) {
    console.error("Republish Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to republish ad",
      error: error.message,
    });
  }
};

const getAdsByType = async (req, res, adType) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const category = req.query.category?.trim() || "";
    const location = req.query.location?.trim() || "";
    const search = req.query.search?.trim() || "";

    const filter = {
      status: "approved",
      type: {
        $regex: `^${escapeRegex(adType)}$`,
        $options: "i",
      },
    };

    if (category) {
      filter.category = {
        $regex: `^${escapeRegex(category)}$`,
        $options: "i",
      };
    }

    if (location) {
      filter.location = {
        $regex: escapeRegex(location),
        $options: "i",
      };
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
        { adId: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [ads, totalAds] = await Promise.all([
      Ad.find(filter)
        .populate("user", "accountId phone name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Ad.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalAds / limit);

    return res.status(200).json({
      success: true,
      type: adType,
      count: ads.length,
      page,
      limit,
      category,
      location,
      search,
      totalAds,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      ads,
    });
  } catch (error) {
    console.error(`Get ${adType} Ads Error:`, error);

    return res.status(500).json({
      success: false,
      message: `Failed to get ${adType} ads`,
      error: error.message,
    });
  }
};

exports.updateAd = async (req, res) => {
  try {
    const ad = await Ad.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    if (ad.status !== "pending") {
      return res.status(403).json({
        success: false,
        message: "Only pending ads can be edited",
      });
    }

    const {
      type,
      title,
      category,
      location,
      price,
      description,
      phone,
      whatsappNumber,
      whatsapp,
      telegram,
      imo,
      viber,
    } = req.body;

    if (title) ad.title = title;
    if (category) ad.category = category;
    if (location) ad.location = location;
    if (price) ad.price = Number(price);
    if (description) ad.description = description;
    if (type) ad.type = type;
    if (phone !== undefined) ad.phone = phone;
    if (whatsappNumber !== undefined) ad.whatsappNumber = whatsappNumber;

    ad.socialAvailability = {
      whatsapp: whatsapp === "true" || whatsapp === true,
      telegram: telegram === "true" || telegram === true,
      imo: imo === "true" || imo === true,
      viber: viber === "true" || viber === true,
    };

    if (req.file) {
      const oldPublicId = ad.image?.filename;
      const isCloudinary = ad.image?.url?.startsWith("http");
      if (oldPublicId && isCloudinary) {
        try {
          await destroy(oldPublicId);
        } catch (e) {
          console.error("Cloudinary destroy error:", e);
        }
      }

      try {
        const result = await uploadBuffer(req.file.buffer, {
          folder: "lanka-ads/ads",
        });
        ad.image = {
          url: result.secure_url,
          filename: result.public_id,
        };
      } catch (uploadError) {
        return res.status(502).json({
          success: false,
          message: "Image upload failed. Please try again.",
        });
      }
    }

    await ad.save();

    const populatedAd = await Ad.findById(ad._id).populate(
      "user",
      "accountId phone name"
    );

    return res.status(200).json({
      success: true,
      message: "Ad updated successfully",
      ad: populatedAd,
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

exports.getVipAds = async (req, res) => {
  return getAdsByType(req, res, "VIP Ad");
};

exports.getSuperAds = async (req, res) => {
  return getAdsByType(req, res, "Super Ad");
};

exports.getNormalAds = async (req, res) => {
  return getAdsByType(req, res, "Normal Ad");
};