const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    code: {
        type: String,
        required: true,
        unique: true
    },

    credits: {
        type: Number,
        required: true,
        min: 1
    }
});

module.exports = mongoose.model("Subject", subjectSchema);