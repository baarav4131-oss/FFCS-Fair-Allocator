const { authorize } = require("./authMiddleware");

/**
 * Admin Middleware
 * Restricts access exclusively to users with the 'admin' role.
 */
const adminMiddleware = authorize("admin");

module.exports = adminMiddleware;
