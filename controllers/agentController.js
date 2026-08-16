const Agent = require("../models/Agent");
const { uploadBuffer, destroy } = require("../utils/cloudinaryUpload");

exports.createAgent = async (req, res) => {
    try {
        const { name, whatsapp, status } = req.body;

        if (!name || !whatsapp) {
            return res.status(400).json({
                success: false,
                message: "Agent name and WhatsApp number are required.",
            });
        }

        let image = { url: "", filename: "" };

        if (req.file) {
            try {
                const result = await uploadBuffer(req.file.buffer, {
                    folder: "lanka-ads/agents",
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

        const agent = await Agent.create({
            name,
            whatsapp,
            status: status || "active",
            image,
        });

        return res.status(201).json({
            success: true,
            message: "Agent created successfully",
            agent,
        });
    } catch (error) {
        console.error("Create Agent Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create agent",
            error: error.message,
        });
    }
};

exports.getPublicAgents = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const search = req.query.search?.trim() || "";

        const filter = {
            status: "active",
        };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { whatsapp: { $regex: search, $options: "i" } },
            ];
        }

        const [agents, totalAgents] = await Promise.all([
            Agent.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Agent.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalAgents / limit);

        return res.status(200).json({
            success: true,
            count: agents.length,
            page,
            limit,
            search,
            totalAgents,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            agents,
        });
    } catch (error) {
        console.error("Get Public Agents Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get public agents",
            error: error.message,
        });
    }
};

exports.getAdminAgents = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const search = req.query.search?.trim() || "";
        const status = req.query.status?.trim() || "";

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { whatsapp: { $regex: search, $options: "i" } },
            ];
        }

        const [agents, totalAgents] = await Promise.all([
            Agent.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Agent.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalAgents / limit);

        return res.status(200).json({
            success: true,
            count: agents.length,
            page,
            limit,
            search,
            totalAgents,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            agents,
        });
    } catch (error) {
        console.error("Get Admin Agents Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get agents",
            error: error.message,
        });
    }
};

exports.updateAgent = async (req, res) => {
    try {
        const existingAgent = await Agent.findById(req.params.id);

        if (!existingAgent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found",
            });
        }

        const { name, whatsapp, status } = req.body;

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
        if (status !== undefined) updateData.status = status;

        let oldPublicId = null;

        if (req.file) {
            try {
                const result = await uploadBuffer(req.file.buffer, {
                    folder: "lanka-ads/agents",
                });

                updateData.image = {
                    url: result.secure_url,
                    filename: result.public_id,
                };

                const previousId = existingAgent.image?.filename;
                const wasCloudinary =
                    existingAgent.image?.url?.startsWith("http");

                if (previousId && wasCloudinary) {
                    oldPublicId = previousId;
                }
            } catch (uploadError) {
                console.error("Cloudinary Upload Error:", uploadError);

                return res.status(502).json({
                    success: false,
                    message: "Image upload failed. Please try again.",
                });
            }
        }

        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found",
            });
        }

        if (oldPublicId) {
            try {
                await destroy(oldPublicId);
            } catch (destroyError) {
                console.error("Cloudinary Destroy Error:", destroyError);

            }
        }

        return res.status(200).json({
            success: true,
            message: "Agent updated successfully",
            agent,
        });
    } catch (error) {
        console.error("Update Agent Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update agent",
            error: error.message,
        });
    }
};

exports.deleteAgent = async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id);

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found",
            });
        }

        const publicId = agent.image?.filename;
        const isCloudinary = agent.image?.url?.startsWith("http");

        if (publicId && isCloudinary) {
            try {
                await destroy(publicId);
            } catch (destroyError) {
                console.error("Cloudinary Destroy Error:", destroyError);

            }
        }

        await agent.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Agent deleted successfully",
        });
    } catch (error) {
        console.error("Delete Agent Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete agent",
            error: error.message,
        });
    }
};