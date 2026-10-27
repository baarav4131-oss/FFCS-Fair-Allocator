const path = require("path");
module.paths.push(path.resolve(__dirname, "../backend/node_modules"));

const bcrypt = require("bcryptjs");

async function verifySalt() {
    console.log("================================================================================");
    console.log("       DA3 Q2(a) BCRYPT CRYPTOGRAPHIC SALT VERIFICATION (EVIDENCE)             ");
    console.log("================================================================================");

    const commonPassword = "StudentPassword@123";
    const user1 = "21BCE1001 (Aarav Sharma)";
    const user2 = "21BCE1004 (Sneha Patel)";

    console.log(`Common Shared Plaintext Password: "${commonPassword}"\n`);

    const salt1 = await bcrypt.genSalt(12);
    const hash1 = await bcrypt.hash(commonPassword, salt1);

    const salt2 = await bcrypt.genSalt(12);
    const hash2 = await bcrypt.hash(commonPassword, salt2);

    // Bcrypt format: $2a$[cost]$[22-char salt][31-char hash]
    const extractedSalt1 = hash1.substring(7, 29);
    const extractedSalt2 = hash2.substring(7, 29);

    console.table([
        {
            Student: user1,
            Plaintext: commonPassword,
            Extracted_Salt: extractedSalt1,
            Full_Bcrypt_Hash: hash1,
        },
        {
            Student: user2,
            Plaintext: commonPassword,
            Extracted_Salt: extractedSalt2,
            Full_Bcrypt_Hash: hash2,
        }
    ]);

    const areHashesEqual = hash1 === hash2;
    const areSaltsEqual = salt1 === salt2;

    console.log(`Are the two hashes identical?: ${areHashesEqual ? "YES (FAILED)" : "NO (PASSED)"}`);
    console.log(`Are the salts unique?:          ${!areSaltsEqual ? "YES (PASSED)" : "NO (FAILED)"}`);

    // Verify both passwords successfully validate despite having distinct hashes
    const match1 = await bcrypt.compare(commonPassword, hash1);
    const match2 = await bcrypt.compare(commonPassword, hash2);

    console.log(`Hash 1 validates against plaintext?: ${match1}`);
    console.log(`Hash 2 validates against plaintext?: ${match2}`);

    console.log("\nCONCLUSION: Even when thousands of students use identical initial passwords,");
    console.log("rainbow table attacks are mathematically neutralized because each student hash");
    console.log("incorporates a distinct 128-bit cryptographically secure pseudorandom salt.");
    console.log("================================================================================");
}

if (require.main === module) {
    verifySalt();
}

module.exports = { verifySalt };
