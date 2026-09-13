const express = require("express");
const Preference = require("../models/Preference");

const router = express.Router();


// CREATE PREFERENCE
router.post("/", async (req, res) => {
    try {
        const {
            studentId,
            subjectId,
            rankedTeacherIds
        } = req.body;

        // Check required fields
        if (!studentId || !subjectId || !rankedTeacherIds) {
            return res.status(400).json({
                message: "Student, subject and teacher preferences are required."
            });
        }

        // Check at least one teacher
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

        // Check if preference already exists for this
        // student and subject
        const existingPreference = await Preference.findOne({
            studentId,
            subjectId
        });

        if (existingPreference) {
            return res.status(400).json({
                message: "You have already submitted preferences for this subject."
            });
        }

        // Create preference
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
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
});


// GET PREFERENCES FOR A STUDENT
router.get("/:studentId", async (req, res) => {
    try {
        const preferences = await Preference.find({
            studentId: req.params.studentId
        });

        res.json(preferences);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
});


// UPDATE PREFERENCE
router.put("/:id", async (req, res) => {
    try {
        const {
            rankedTeacherIds
        } = req.body;

        // Check that teacher list exists
        if (!rankedTeacherIds || rankedTeacherIds.length === 0) {
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

        const preference = await Preference.findByIdAndUpdate(
            req.params.id,
            {
                rankedTeacherIds
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!preference) {
            return res.status(404).json({
                message: "Preference not found."
            });
        }

        res.json({
            message: "Preference updated successfully.",
            preference
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
});


// DELETE PREFERENCE
router.delete("/:id", async (req, res) => {
    try {
        const preference = await Preference.findByIdAndDelete(
            req.params.id
        );

        if (!preference) {
            return res.status(404).json({
                message: "Preference not found."
            });
        }

        res.json({
            message: "Preference withdrawn successfully"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;