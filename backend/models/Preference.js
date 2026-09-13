const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },

    rankedTeacherIds: {
        type: [String],
        required: true,
        default: []
    }
});

// One preference list per student per subject
preferenceSchema.index(
    { studentId: 1, subjectId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Preference", preferenceSchema);
