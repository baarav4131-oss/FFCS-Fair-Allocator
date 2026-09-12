const dns=require("dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes=require("./routes/auth");
const subjectRoutes=require("./routes/subject");
const teacherSectionRoutes=require("./routes/teacherSection");
const preferenceRoutes=require("./routes/preferences");
const allocationRoutes = require("./routes/allocation");
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/allocate", allocationRoutes);
app.use("/api/teacher-sections", teacherSectionRoutes);
app.use("/api/preferences", preferenceRoutes);

app.get("/", (req, res) => {
    res.send("FFCS Fair Allocator API is running");
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed:");
        console.log(error.message);
    });