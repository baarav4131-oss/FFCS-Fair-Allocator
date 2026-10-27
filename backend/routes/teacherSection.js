const express = require("express");
const TeacherSection = require("../models/TeacherSection");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// GET all sections (Authenticated)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const sections = await TeacherSection.find().populate("subject_id");
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE section (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const section = await TeacherSection.create({
            subject_id: req.body.subject_id,
            teacher_name: req.body.teacher_name,
            capacity: req.body.capacity,
            seats_remaining: req.body.capacity
        });
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE section (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const section = await TeacherSection.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!section) {
            return res.status(404).json({ message: "Teacher section not found" });
        }
        res.json(section);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE section (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const section = await TeacherSection.findByIdAndDelete(req.params.id);
        if (!section) {
            return res.status(404).json({ message: "Teacher section not found" });
        }
        res.json({ message: "Teacher section deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
