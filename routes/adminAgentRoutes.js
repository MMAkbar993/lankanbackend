const express = require("express");

const {
    createAgent,
    getAdminAgents,
    updateAgent,
    deleteAgent,
} = require("../controllers/agentController");

const { protectAdmin } = require("../middleware/adminMiddleware");
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

router.get("/", protectAdmin, getAdminAgents);
router.post("/", protectAdmin, uploadSingleAgentImage, createAgent);
router.put("/:id", protectAdmin, uploadSingleAgentImage, updateAgent);
router.delete("/:id", protectAdmin, deleteAgent);

module.exports = router;