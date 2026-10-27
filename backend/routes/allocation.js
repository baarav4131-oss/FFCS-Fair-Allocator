const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Preference = require("../models/Preference");
const TeacherSection = require("../models/TeacherSection");
const Allocation = require("../models/Allocation");
const AllocationLock = require("../models/AllocationLock");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// RUN ALLOCATION (Protected, Distributed Mutex Lock, Atomic Seat Decrement)
router.post(
    "/run",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        const lockId = "GLOBAL_ALLOCATION_LOCK";
        const instanceId = process.env.INSTANCE_ID || "api1";
        const now = new Date();
        const lockExpiry = new Date(now.getTime() + 60000); // 60s safety timeout

        let lockAcquired = false;

        try {
            // Attempt atomic distributed lock acquisition
            try {
                await AllocationLock.create({
                    lock_id: lockId,
                    acquired_by: instanceId,
                    acquired_at: now,
                    expires_at: lockExpiry
                });
                lockAcquired = true;
            } catch (lockErr) {
                // Check if existing lock has expired
                const existingLock = await AllocationLock.findOne({ lock_id: lockId });
                if (existingLock && existingLock.expires_at < now) {
                    await AllocationLock.deleteOne({ lock_id: lockId });
                    await AllocationLock.create({
                        lock_id: lockId,
                        acquired_by: instanceId,
                        acquired_at: now,
                        expires_at: lockExpiry
                    });
                    lockAcquired = true;
                }
            }

            if (!lockAcquired) {
                return res.status(409).json({
                    message: "Allocation algorithm is already executing on another backend instance. Concurrency lock active."
                });
            }

            // Clear previous allocations
            await Allocation.deleteMany({});

            // Reset teacher section seats
            const sections = await TeacherSection.find();
            for (const section of sections) {
                section.seats_remaining = section.capacity;
                await section.save();
            }

            const allocatedStudents = new Set();
            let unallocatedCourses = 0;

            // Process Tier 1, then Tier 2, then Tier 3
            for (let tier = 1; tier <= 3; tier++) {
                const students = await Student.find({ tier }).sort({ cgpa: -1 });

                for (const student of students) {
                    const preferences = await Preference.find({ studentId: student._id });
                    const processedSubjects = new Set();

                    for (const preference of preferences) {
                        const subjectId = preference.subjectId.toString();
                        if (processedSubjects.has(subjectId)) {
                            continue;
                        }
                        processedSubjects.add(subjectId);

                        let allocated = false;

                        // Check teachers in ranked order
                        for (let i = 0; i < preference.rankedTeacherIds.length; i++) {
                            const teacherId = preference.rankedTeacherIds[i];

                            // DA3 ATOMIC FIX: findOneAndUpdate with seats_remaining > 0 and $inc: -1
                            const updatedSection = await TeacherSection.findOneAndUpdate(
                                { _id: teacherId, seats_remaining: { $gt: 0 } },
                                { $inc: { seats_remaining: -1 } },
                                { new: true }
                            );

                            if (updatedSection) {
                                await Allocation.create({
                                    student_id: student._id,
                                    subject_id: preference.subjectId,
                                    teacher_id: updatedSection._id,
                                    preference_rank_achieved: i + 1
                                });

                                allocatedStudents.add(student._id.toString());
                                allocated = true;
                                break;
                            }
                        }

                        if (!allocated) {
                            unallocatedCourses++;
                        }
                    }
                }
            }

            res.json({
                message: "Allocation completed successfully (atomic concurrency safe)",
                instance_processed_by: instanceId,
                allocated: allocatedStudents.size,
                unallocated: unallocatedCourses
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        } finally {
            // Release lock if acquired by this instance
            if (lockAcquired) {
                await AllocationLock.deleteOne({ lock_id: lockId });
            }
        }
    }
);

// GET ALLOCATION RESULTS (Restricted to self or admin)
router.get("/results/:studentId", authMiddleware, async (req, res) => {
    try {
        if (req.studentId !== req.params.studentId && req.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: You cannot view allocation results of other students."
            });
        }

        const allocations = await Allocation.find({
            student_id: req.params.studentId
        })
            .populate("subject_id")
            .populate("teacher_id");

        res.json(allocations);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
