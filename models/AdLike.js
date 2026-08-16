const mongoose = require("mongoose");

const adLikeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        ad: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ad",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

adLikeSchema.index({ user: 1, ad: 1 }, { unique: true });

module.exports = mongoose.model("AdLike", adLikeSchema);