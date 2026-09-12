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

module.exports = mongoose.model("Preference", preferenceSchema);
