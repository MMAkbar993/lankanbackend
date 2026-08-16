const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
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

        whatsapp: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true,
        },
    },
    { timestamps: true }
);

agentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Agent", agentSchema);