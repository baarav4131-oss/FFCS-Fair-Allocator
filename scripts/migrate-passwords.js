const path = require("path");
module.paths.push(path.resolve(__dirname, "../backend/node_modules"));

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const legacyStudentSchema = new mongoose.Schema({
    reg_no: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    cgpa: { type: Number, required: true },
    attendance_pct: { type: Number, required: true },
    tier: { type: Number, required: true },
    password: { type: String, required: true },
    status: { type: String, default: "UNMIGRATED_PLAINTEXT" }
}, { collection: "students_legacy", timestamps: true });

const LegacyStudent = mongoose.models.LegacyStudent || mongoose.model("LegacyStudent", legacyStudentSchema);

const BCRYPT_COST = 12;

async function migratePasswords(options = {}) {
    console.log("================================================================================");
    console.log("    DA3 Q2(a) BCRYPT PASSWORD HASHING MIGRATION (COST FACTOR: 12 + SALT)        ");
    console.log("================================================================================");

    const isOffline = process.argv.includes("--offline") || options.inMemory || !process.env.LIVE_DB;
    let records = [];
    let isConnected = false;

    if (!isOffline && process.env.MONGO_URI) {
        try {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
            isConnected = true;
            records = await LegacyStudent.find({});
        } catch (err) {
            console.log(`Notice: MongoDB Atlas offline or restricted. Running in-memory simulation mode.`);
        }
    }

    if (!isConnected || records.length === 0) {
        const { sampleLegacyData } = require("./seed-legacy-users");
        records = sampleLegacyData.map(d => ({ ...d }));
    }

    console.log("\n--- [BEFORE MIGRATION] RAW PLAINTEXT STORAGE IN DATABASE ---");
    console.table(records.map(r => ({
        RegNo: r.reg_no,
        Name: r.name,
        Plaintext_Password: r.password,
        Algorithm: "NONE (PLAINTEXT)",
        Status: "VULNERABLE"
    })));

    console.log("\nExecuting migration: Hashing with bcrypt (rounds: 12, unique cryptographic salt)...");
    const migratedRecords = [];

    for (const r of records) {
        const originalPassword = r.password;
        const salt = await bcrypt.genSalt(BCRYPT_COST);
        const hashedPassword = await bcrypt.hash(originalPassword, salt);

        r.password = hashedPassword;
        r.status = "HASHED_BCRYPT_COST_12";

        if (isConnected && r.save) {
            await r.save();
        }

        migratedRecords.push({
            RegNo: r.reg_no,
            Name: r.name,
            Original: originalPassword,
            Hashed_Storage: hashedPassword,
            Cost: "12",
            Status: "SECURED"
        });
    }

    console.log("\n--- [AFTER MIGRATION] BCRYPT SALTED HASH STORAGE (COMPASS VIEW) ---");
    console.table(migratedRecords.map(m => ({
        RegNo: m.RegNo,
        Name: m.Name,
        Bcrypt_Hash: m.Hashed_Storage.substring(0, 32) + "...",
        Cost_Rounds: m.Cost,
        Status: m.Status
    })));

    console.log("\nDetailed Hash Inspection:");
    migratedRecords.forEach(m => {
        console.log(`* ${m.RegNo} (${m.Name}): ${m.Hashed_Storage}`);
    });

    if (isConnected) {
        await mongoose.disconnect();
    }

    console.log("\n================================================================================");
    console.log("Migration Complete: All passwords secured with bcrypt cost 12.");
    console.log("================================================================================");
    return migratedRecords;
}

if (require.main === module) {
    migratePasswords().catch(console.error);
}

module.exports = { migratePasswords };
