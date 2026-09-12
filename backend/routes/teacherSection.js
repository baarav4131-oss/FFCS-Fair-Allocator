const express = require("express");
const router = express.Router();

const TeacherSection = require("../models/TeacherSection");

router.post("/", async (req, res) => {
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

router.get("/", async (req, res) => {
  try {
    const sections = await TeacherSection.find();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;