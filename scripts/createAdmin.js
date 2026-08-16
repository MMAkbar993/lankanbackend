const mongoose = require("mongoose");
const Admin = require("../models/Admin");
require("dotenv").config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = "admin@lankanads.com";
        const password = "12345678";

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        await Admin.create({
            name: "Admin",
            email,
            password,
            role: "admin",
            status: "active",
        });

        console.log("Admin created successfully");
        console.log("Email:", email);
        console.log("Password:", password);

        process.exit(0);
    } catch (error) {
        console.error("Create Admin Error:", error);
        process.exit(1);
    }
};

createAdmin();