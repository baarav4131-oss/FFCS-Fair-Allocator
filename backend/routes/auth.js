const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const computeTier = require("../utils/tier");
const { generateSecret, verifyToken, generateOtpauthUri } = require("../utils/totp");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const BCRYPT_ROUNDS = 12; // Hardened cost factor

// In-memory rate limiter for MFA verification (prevents 6-digit brute force)
const mfaAttempts = new Map();
const MAX_MFA_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

function checkMfaRateLimit(identifier) {
    const now = Date.now();
    const record = mfaAttempts.get(identifier);
    if (!record) {
        mfaAttempts.set(identifier, { count: 1, firstAttempt: now });
        return { allowed: true };
    }
    if (now - record.firstAttempt > LOCKOUT_MS) {
        mfaAttempts.set(identifier, { count: 1, firstAttempt: now });
        return { allowed: true };
    }
    if (record.count >= MAX_MFA_ATTEMPTS) {
        const remainingSec = Math.ceil((LOCKOUT_MS - (now - record.firstAttempt)) / 1000);
        return { allowed: false, remainingSec };
    }
    record.count += 1;
    return { allowed: true };
}

function clearMfaRateLimit(identifier) {
    mfaAttempts.delete(identifier);
}

// SIGNUP (Cost 12 salted bcrypt hash)
router.post("/signup", async (req, res) => {
    try {
        const { name, cgpa, attendance_pct, email, password } = req.body;

        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const tier = computeTier(cgpa, attendance_pct);
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const student = await Student.create({
            name,
            cgpa,
            attendance_pct,
            tier,
            email,
            password: hashedPassword,
            role: "student",
            mfa_enabled: false
        });

        res.status(201).json({
            message: "Student registered successfully",
            studentId: student._id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// LOGIN (Step 1: Password authentication + Rehash on login + MFA challenge)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Rehash-on-login: detect old cost factors (< 12) and upgrade transparently
        const roundsMatch = student.password.match(/^\$2[aby]\$(\d+)\$/);
        const currentRounds = roundsMatch ? parseInt(roundsMatch[1], 10) : 10;
        if (currentRounds < BCRYPT_ROUNDS) {
            const upgradedHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            await Student.findByIdAndUpdate(student._id, { password: upgradedHash });
            console.log(`[Security] Upgraded bcrypt rounds from ${currentRounds} to ${BCRYPT_ROUNDS} for ${student.email}`);
        }

        // MFA enforcement: Mandatory for admins or users with mfa_enabled = true
        const requiresMfa = student.mfa_enabled || student.role === "admin";

        if (requiresMfa) {
            // If user has no secret initialized yet, generate one automatically
            if (!student.mfa_secret) {
                student.mfa_secret = generateSecret();
                await student.save();
            }

            const mfaToken = jwt.sign(
                { studentId: student._id, isMfaPending: true },
                process.env.JWT_SECRET || "ffcs_secret_123",
                { expiresIn: "5m" }
            );

            return res.json({
                message: "MFA challenge required",
                mfaRequired: true,
                mfaToken,
                studentId: student._id,
                role: student.role
            });
        }

        // Standard 1-step login (used for non-MFA students and performance load testing)
        const token = jwt.sign(
            { studentId: student._id, role: student.role },
            process.env.JWT_SECRET || "ffcs_secret_123",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            studentId: student._id,
            role: student.role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// MFA STEP 2: VERIFY 6-DIGIT CODE
router.post("/mfa/verify", async (req, res) => {
    try {
        const { mfaToken, code } = req.body;

        if (!mfaToken || !code) {
            return res.status(400).json({ message: "Both mfaToken and 6-digit code are required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(mfaToken, process.env.JWT_SECRET || "ffcs_secret_123");
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired MFA session" });
        }

        const rateLimit = checkMfaRateLimit(decoded.studentId);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                message: `Too many failed attempts. Try again in ${rateLimit.remainingSec} seconds.`
            });
        }

        const student = await Student.findById(decoded.studentId);
        if (!student || !student.mfa_secret) {
            return res.status(400).json({ message: "MFA is not configured for this account" });
        }

        const isValid = verifyToken(student.mfa_secret, code.trim());
        if (!isValid) {
            return res.status(401).json({ message: "Invalid TOTP code" });
        }

        // Success: clear rate limit
        clearMfaRateLimit(decoded.studentId);

        // Issue full access JWT
        const token = jwt.sign(
            { studentId: student._id, role: student.role },
            process.env.JWT_SECRET || "ffcs_secret_123",
            { expiresIn: "1d" }
        );

        res.json({
            message: "MFA verification successful",
            token,
            studentId: student._id,
            role: student.role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// MFA SETUP: ENROLL AUTHENTICATOR APP
router.post("/mfa/setup", authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const secret = generateSecret();
        student.mfa_secret = secret;
        student.mfa_enabled = true;
        await student.save();

        const otpauthUrl = generateOtpauthUri({
            email: student.email,
            issuer: "FFCS-Fair-Allocator",
            secret
        });

        res.json({
            message: "MFA secret generated successfully",
            secret,
            otpauthUrl,
            instructions: "Enter this secret in Google Authenticator or scan the otpauth URL."
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE ADMIN (Role: admin, MFA mandatory)
router.post("/create-admin", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await Student.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const secret = generateSecret();

        const admin = await Student.create({
            name,
            cgpa: 10,
            attendance_pct: 100,
            tier: 1,
            email,
            password: hashedPassword,
            role: "admin",
            mfa_enabled: true,
            mfa_secret: secret
        });

        const otpauthUrl = generateOtpauthUri({
            email: admin.email,
            issuer: "FFCS-Fair-Allocator",
            secret
        });

        res.status(201).json({
            message: "Admin created successfully with mandatory MFA",
            adminId: admin._id,
            mfa_secret: secret,
            otpauthUrl
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
