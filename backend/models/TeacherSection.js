const mongoose = require("mongoose");

const teacherSectionSchema = new mongoose.Schema({
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    teacher_name: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    seats_remaining: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("TeacherSection", teacherSectionSchema);