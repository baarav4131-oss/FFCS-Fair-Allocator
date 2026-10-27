const mongoose = require("mongoose");

/**
 * Concurrency Lock Model
 * Ensures mutually exclusive execution of the course allocation algorithm
 * across scaled horizontal backend instances (api1, api2, api3).
 */
const allocationLockSchema = new mongoose.Schema({
    lock_id: { type: String, required: true, unique: true },
    acquired_by: { type: String, required: true },
    acquired_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true }
});

module.exports = mongoose.model("AllocationLock", allocationLockSchema);
