const express = require("express");
const {
    getAllUsers,
    getUserById,
} = require("../controllers/adminUserController");

const router = express.Router();

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);

module.exports = router;