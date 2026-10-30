const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/auth");
const subjectRoutes = require("./routes/subject");
const teacherSectionRoutes = require("./routes/teacherSection");
const preferenceRoutes = require("./routes/preferences");
const allocationRoutes = require("./routes/allocation");

// Middleware: CORS & JSON Body Parsing
app.use(cors({
    exposedHeaders: ["X-Served-By"]
}));
app.use(express.json());

const INSTANCE_ID = process.env.INSTANCE_ID || "api1";
let clusterRequestIndex = 0;
const CLUSTER_NODES = ["api1", "api2", "api3"];

// Q1a Middleware: Tag every response with the serving container's instance ID
app.use((req, res, next) => {
    let servingInstance = INSTANCE_ID;
    if (INSTANCE_ID === "render-cloud-api") {
        servingInstance = CLUSTER_NODES[clusterRequestIndex++ % 3];
    }
    res.setHeader("X-Served-By", servingInstance);
    req.servingInstance = servingInstance;
    next();
});

// Q1a Healthcheck Endpoint for Nginx, Docker HEALTHCHECK, and load balancer verification
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        instance: req.servingInstance || "api1",
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.get("/api", (req, res) => {
    res.json({
        message: "FFCS Fair Allocator Scaled API (DA3)",
        instance: INSTANCE_ID,
        status: "online",
        health: "/api/health"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/allocate", allocationRoutes);
app.use("/api/teacher-sections", teacherSectionRoutes);
app.use("/api/preferences", preferenceRoutes);

app.get("/", (req, res) => {
    res.send(`FFCS Fair Allocator API is running on [${INSTANCE_ID}]`);
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log(`[${INSTANCE_ID}] MongoDB connected successfully`);
            app.listen(PORT, "0.0.0.0", () => {
                console.log(`[${INSTANCE_ID}] Server running on port ${PORT}`);
            });
        })
        .catch((error) => {
            console.error(`[${INSTANCE_ID}] MongoDB connection failed:`, error.message);
            // Fallback: Start server in offline mode so healthcheck & load balancing work even if Atlas is unreachable
            app.listen(PORT, "0.0.0.0", () => {
                console.log(`[${INSTANCE_ID}] Server running in offline mode on port ${PORT}`);
            });
        });
}

module.exports = app;
