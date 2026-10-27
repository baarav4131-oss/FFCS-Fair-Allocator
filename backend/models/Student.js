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
    },

    mfa_enabled: {
        type: Boolean,
        default: false
    },

    mfa_secret: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
