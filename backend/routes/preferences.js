const express = require("express");
const Preference = require("../models/Preference");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE PREFERENCE (studentId derived securely from JWT - closes DA1 vulnerability)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId; // Enforced from authenticated JWT
        const { subjectId, rankedTeacherIds } = req.body;

        if (!subjectId || !rankedTeacherIds) {
            return res.status(400).json({
                message: "Subject and teacher preferences are required."
            });
        }

        if (rankedTeacherIds.length === 0) {
            return res.status(400).json({
                message: "Please select at least one teacher."
            });
        }

        // Prevent duplicate teachers
        const uniqueTeacherIds = new Set(rankedTeacherIds);
        if (uniqueTeacherIds.size !== rankedTeacherIds.length) {
            return res.status(400).json({
                message: "A teacher cannot be selected more than once."
            });
        }

        // Check if preference already exists for this student and subject
        const existingPreference = await Preference.findOne({
            studentId,
            subjectId
        });

        if (existingPreference) {
            return res.status(400).json({
                message: "You have already submitted preferences for this subject."
            });
        }

        const preference = await Preference.create({
            studentId,
            subjectId,
            rankedTeacherIds
        });

        res.status(201).json({
            message: "Preferences submitted successfully.",
            preference
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET PREFERENCES FOR A STUDENT (Restricted to self or admin)
router.get("/:studentId", authMiddleware, async (req, res) => {
    try {
        if (req.studentId !== req.params.studentId && req.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: You cannot view preferences of other students."
            });
        }

        const preferences = await Preference.find({
            studentId: req.params.studentId
        });

        res.json(preferences);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE PREFERENCE (Strict ownership check - closes DA1 vulnerability)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { rankedTeacherIds } = req.body;

        if (!rankedTeacherIds || rankedTeacherIds.length === 0) {
            return res.status(400).json({
                message: "Please select at least one teacher."
            });
        }

        const uniqueTeacherIds = new Set(rankedTeacherIds);
        if (uniqueTeacherIds.size !== rankedTeacherIds.length) {
            return res.status(400).json({
                message: "A teacher cannot be selected more than once."
            });
        }

        // Fetch preference and check ownership
        const preference = await Preference.findById(req.params.id);
        if (!preference) {
            return res.status(404).json({ message: "Preference not found." });
        }

        if (preference.studentId.toString() !== req.studentId && req.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: You cannot modify another student's preference."
            });
        }

        preference.rankedTeacherIds = rankedTeacherIds;
        await preference.save();

        res.json({
            message: "Preference updated successfully.",
            preference
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE PREFERENCE (Strict ownership check - closes DA1 vulnerability)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const preference = await Preference.findById(req.params.id);
        if (!preference) {
            return res.status(404).json({ message: "Preference not found." });
        }

        if (preference.studentId.toString() !== req.studentId && req.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: You cannot delete another student's preference."
            });
        }

        await Preference.findByIdAndDelete(req.params.id);

        res.json({
            message: "Preference withdrawn successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
