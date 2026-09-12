const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cgpa: { type: Number, required: true },
    attendance_pct: { type: Number, required: true },
    tier: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
        type: String,
        enum: ["student", "admin"],
        default: "student"
    }
});

module.exports = mongoose.model("Student", studentSchema);