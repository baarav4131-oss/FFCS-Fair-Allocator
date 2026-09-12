const express = require("express");
const Subject = require("../models/Subject");

const router = express.Router();

// Add subject
router.post("/", async (req, res) => {
    try {
        const subject = await Subject.create(req.body);
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all subjects
router.get("/", async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update subject
router.put("/:id", async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete subject
router.delete("/:id", async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: "Subject deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;