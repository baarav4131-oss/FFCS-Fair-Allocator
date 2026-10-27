const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * Enforces JWT verification and prevents access using partial MFA tokens.
 */
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "ffcs_secret_123");

        // Prevent partial/unverified MFA tokens from accessing protected routes
        if (decoded.isMfaPending) {
            return res.status(401).json({
                message: "MFA verification pending. Complete TOTP challenge first."
            });
        }

        req.studentId = decoded.studentId;
        req.role = decoded.role || "student";

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'student')
 */
const authorize = (...roles) => (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
        return res.status(403).json({
            message: "Forbidden: insufficient permissions"
        });
    }
    next();
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.authorize = authorize;
