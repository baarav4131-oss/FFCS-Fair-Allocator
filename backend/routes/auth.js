const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const computeTier = require("../utils/tier");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { name, cgpa, attendance_pct, email, password } = req.body;

        const existingStudent = await Student.findOne({ email });

        if (existingStudent) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const tier = computeTier(cgpa, attendance_pct);

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await Student.create({
            name,
            cgpa,
            attendance_pct,
            tier,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Student registered successfully",
            studentId: student._id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
    {
        studentId: student._id,
        role: student.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);

        res.json({
    message: "Login successful",
    token,
    studentId: student._id
});

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.post("/create-admin", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingStudent = await Student.findOne({ email });

        if (existingStudent) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Student.create({
            name,
            cgpa: 0,
            attendance_pct: 0,
            tier: 3,
            email,
            password: hashedPassword,
            role: "admin"
        });

        res.status(201).json({
            message: "Admin created successfully",
            adminId: admin._id
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});
module.exports = router;