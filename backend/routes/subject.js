const express = require("express");
const Subject = require("../models/Subject");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// GET all subjects (Authenticated students & admins)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE subject (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.create(req.body);
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE subject (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE subject (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
