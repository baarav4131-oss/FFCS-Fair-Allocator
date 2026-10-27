const path = require("path");
module.paths.push(path.resolve(__dirname, "../backend/node_modules"));

const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const legacyStudentSchema = new mongoose.Schema({
    reg_no: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    cgpa: { type: Number, required: true },
    attendance_pct: { type: Number, required: true },
    tier: { type: Number, required: true },
    password: { type: String, required: true },
    status: { type: String, default: "UNMIGRATED_PLAINTEXT" }
}, { collection: "students_legacy", timestamps: true });

const LegacyStudent = mongoose.models.LegacyStudent || mongoose.model("LegacyStudent", legacyStudentSchema);

const sampleLegacyData = [
    { reg_no: "21BCE1001", name: "Aarav Sharma", email: "aarav.s2021@vitstudent.ac.in", cgpa: 9.4, attendance_pct: 92, tier: 1, password: "StudentPassword@123" },
    { reg_no: "21BCE1002", name: "Priya Nair", email: "priya.n2021@vitstudent.ac.in", cgpa: 8.7, attendance_pct: 88, tier: 1, password: "SecureStudent#2026" },
    { reg_no: "21BCE1003", name: "Rohan Verma", email: "rohan.v2021@vitstudent.ac.in", cgpa: 7.9, attendance_pct: 80, tier: 2, password: "CampusLogin!99" },
    { reg_no: "21BCE1004", name: "Sneha Patel", email: "sneha.p2021@vitstudent.ac.in", cgpa: 6.8, attendance_pct: 76, tier: 3, password: "StudentPassword@123" }
];

async function seedLegacy() {
    console.log("================================================================================");
    console.log("       DA3 Q2(a) SEEDING 'students_legacy' WITH PLAINTEXT ERP EXPORT DATA       ");
    console.log("================================================================================");
    
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ffcs_test", { serverSelectionTimeoutMS: 2000 });
        console.log("Connected to MongoDB.");

        await LegacyStudent.deleteMany({});
        const inserted = await LegacyStudent.insertMany(sampleLegacyData);

        console.log(`Successfully seeded ${inserted.length} legacy student accounts.\n`);
        console.log("DATABASE SNAPSHOT: BEFORE (Compass / MongoDB CLI View):");
        console.table(inserted.map(s => ({
            RegNo: s.reg_no,
            Name: s.name,
            Tier: s.tier,
            Stored_Password: s.password,
            Security_Status: s.status
        })));

        console.log("\nNotice: Passwords stored as raw plaintext strings! High risk finding.");
        await mongoose.disconnect();
    } catch (err) {
        console.log(`Notice: MongoDB connection (${err.message}). Displaying local ERP snapshot:`);
        console.table(sampleLegacyData.map(s => ({
            RegNo: s.reg_no,
            Name: s.name,
            Tier: s.tier,
            Stored_Password: s.password,
            Security_Status: "UNMIGRATED_PLAINTEXT"
        })));
    }
}

if (require.main === module) {
    seedLegacy();
}

module.exports = { seedLegacy, sampleLegacyData };
