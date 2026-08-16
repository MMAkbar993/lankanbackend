const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        accountId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        name: {
            type: String,
            default: "",
        },

        isVerified: {
            type: Boolean,
            default: true,
        },

        lastLoginAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);