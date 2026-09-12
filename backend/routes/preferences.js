const express = require("express");
const Preference = require("../models/Preference");

const router = express.Router();

// Create preference
router.post("/", async (req, res) => {
    try {
        const preference = await Preference.findOneAndUpdate(
            {
                studentId: req.body.studentId,
                subjectId: req.body.subjectId
            },
            {
                rankedTeacherIds: req.body.rankedTeacherIds
            },
            {
                new: true,
                upsert: true
            }
        );

        res.status(201).json(preference);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
});

// Get student's preferences
router.get("/:studentId", async (req, res) => {
    try {
        const preferences = await Preference.find({
            studentId: req.params.studentId
        });

        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update preference
router.put("/:id", async (req, res) => {
    try {
        const preference = await Preference.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(preference);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete preference
router.delete("/:id", async (req, res) => {
    try {
        await Preference.findByIdAndDelete(req.params.id);

        res.json({
            message: "Preference withdrawn successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;