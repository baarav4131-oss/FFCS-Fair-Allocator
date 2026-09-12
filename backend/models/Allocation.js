const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherSection",
        required: true
    },
    preference_rank_achieved: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("Allocation", allocationSchema);
