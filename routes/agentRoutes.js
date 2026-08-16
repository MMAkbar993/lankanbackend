const express = require("express");

const {
    createAgent,
    getPublicAgents,
    getAdminAgents,
    updateAgent,
    deleteAgent,
} = require("../controllers/agentController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadAgentMiddleware");

const router = express.Router();

const uploadSingleAgentImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Image upload failed",
                error: error.message,
            });
        }

        next();
    });
};

/* Public website */
router.get("/public", getPublicAgents);

/* Admin panel */
router.post("/", protect, uploadSingleAgentImage, createAgent);
router.get("/", protect, getAdminAgents);
router.put("/:id", protect, uploadSingleAgentImage, updateAgent);
router.delete("/:id", protect, deleteAgent);

module.exports = router;