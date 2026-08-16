const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    adId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    image: {
      url: {
        type: String,
        default: "",
      },
      filename: {
        type: String,
        default: "",
      },
    },

    type: {
      type: String,
      enum: ["Super Ad", "Normal Ad", "VIP Ad", "NRA Ad"],
      default: "Super Ad",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    socialAvailability: {
      whatsapp: {
        type: Boolean,
        default: false,
      },
      telegram: {
        type: Boolean,
        default: false,
      },
      imo: {
        type: Boolean,
        default: false,
      },
      viber: {
        type: Boolean,
        default: false,
      },
    },
    phone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired", "inactive"],
      default: "pending",
      index: true,
    },
    approvedAt: {
        type: Date,
        default: null,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    },

    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);
