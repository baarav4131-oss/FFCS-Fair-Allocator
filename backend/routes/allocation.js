const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Preference = require("../models/Preference");
const TeacherSection = require("../models/TeacherSection");
const Allocation = require("../models/Allocation");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post(
    "/run",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            // Clear previous allocations
            await Allocation.deleteMany({});

            // Reset teacher seats
            const sections = await TeacherSection.find();

            for (const section of sections) {
                section.seats_remaining = section.capacity;
                await section.save();
            }

            // Track students who received at least one allocation
            const allocatedStudents = new Set();

            // Track courses that could not be allocated
            let unallocatedCourses = 0;

            // Process Tier 1, then Tier 2, then Tier 3
            for (let tier = 1; tier <= 3; tier++) {

                const students = await Student.find({ tier })
                    .sort({ cgpa: -1 });

                for (const student of students) {

                    const preferences = await Preference.find({
                        studentId: student._id
                    });

                    // Prevent duplicate subjects for the same student
                    const processedSubjects = new Set();

                    for (const preference of preferences) {

                        const subjectId =
                            preference.subjectId.toString();

                        // Skip duplicate preference for same subject
                        if (processedSubjects.has(subjectId)) {
                            continue;
                        }

                        processedSubjects.add(subjectId);

                        let allocated = false;

                        // Check teachers in ranked order
                        for (
                            let i = 0;
                            i < preference.rankedTeacherIds.length;
                            i++
                        ) {

                            const teacherId =
                                preference.rankedTeacherIds[i];

                            const section =
                                await TeacherSection.findById(teacherId);

                            if (
                                section &&
                                section.seats_remaining > 0
                            ) {

                                // Reduce available seats
                                section.seats_remaining -= 1;
                                await section.save();

                                // Create allocation
                                await Allocation.create({
                                    student_id: student._id,
                                    subject_id: preference.subjectId,
                                    teacher_id: section._id,
                                    preference_rank_achieved: i + 1
                                });

                                // Count student only once
                                allocatedStudents.add(
                                    student._id.toString()
                                );

                                allocated = true;

                                break;
                            }
                        }

                        // Course could not be allocated
                        if (!allocated) {
                            unallocatedCourses++;
                        }
                    }
                }
            }

            res.json({
                message: "Allocation completed successfully",
                allocated: allocatedStudents.size,
                unallocated: unallocatedCourses
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message: error.message
            });
        }
    }
);


// Get allocation results for a student
router.get("/results/:studentId", async (req, res) => {
    try {

        const allocations = await Allocation.find({
            student_id: req.params.studentId
        })
            .populate("subject_id")
            .populate("teacher_id");

        res.json(allocations);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;