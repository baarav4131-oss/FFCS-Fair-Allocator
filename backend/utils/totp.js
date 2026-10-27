/**
 * RFC 6238 / RFC 4226 Compliant TOTP Engine
 * Uses Node.js native crypto module (Zero external dependencies required).
 * Fully compatible with Google Authenticator, Microsoft Authenticator, Authy.
 */
const crypto = require("crypto");

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
    let bits = 0;
    let value = 0;
    let output = "";

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
}

function base32Decode(base32) {
    const clean = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
    let bits = 0;
    let value = 0;
    const bytes = [];

    for (let i = 0; i < clean.length; i++) {
        const val = BASE32_ALPHABET.indexOf(clean[i]);
        if (val === -1) continue;
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(bytes);
}

/**
 * Generate a random 20-byte base32 secret
 */
function generateSecret(length = 20) {
    const randomBytes = crypto.randomBytes(length);
    return base32Encode(randomBytes);
}

/**
 * Generate a 6-digit TOTP code for a given secret and counter
 */
function generateToken(secret, stepOffset = 0, timeStep = 30) {
    const key = base32Decode(secret);
    const counter = Math.floor(Date.now() / 1000 / timeStep) + stepOffset;

    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac("sha1", key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
        ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
}

/**
 * Verify a 6-digit TOTP code with time-drift window (+/- 1 step)
 */
function verifyToken(secret, token, window = 1, timeStep = 30) {
    if (!token || typeof token !== "string" || token.length !== 6) {
        return false;
    }

    for (let step = -window; step <= window; step++) {
        const expected = generateToken(secret, step, timeStep);
        if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) {
            return true;
        }
    }
    return false;
}

/**
 * Generate otpauth:// URI for authenticator QR code apps
 */
function generateOtpauthUri({ email, issuer = "FFCS-Fair-Allocator", secret }) {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
    generateSecret,
    generateToken,
    verifyToken,
    generateOtpauthUri
};
