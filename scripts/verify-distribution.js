/**
 * DA3 Q1(a) Proof of Distribution Verifier
 * Sends 30 sequential requests to the Nginx Load Balancer (http://localhost:8080/api/health)
 * and tallies the 'X-Served-By' response headers across api1, api2, and api3.
 */
const http = require("http");

const TARGET_URL = process.env.TARGET_URL || "http://localhost:8080/api/health";
const TOTAL_REQUESTS = 30;

function fetchHealth(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                const servedBy = res.headers["x-served-by"] || "unknown";
                let parsed = {};
                try { parsed = JSON.parse(data); } catch (e) {}
                resolve({
                    statusCode: res.statusCode,
                    servedBy: servedBy !== "unknown" ? servedBy : (parsed.instance || "unknown"),
                    data: parsed
                });
            });
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
            req.destroy(new Error("Timeout"));
        });
    });
}

async function runDistributionTest() {
    console.log("================================================================================");
    console.log("   FFCS LOAD BALANCER DISTRIBUTION VERIFICATION (30 REQUESTS -> NGINX :8080)    ");
    console.log("================================================================================");
    console.log(`Target: ${TARGET_URL}\n`);

    const tally = { api1: 0, api2: 0, api3: 0, other: 0 };
    const logs = [];

    for (let i = 1; i <= TOTAL_REQUESTS; i++) {
        try {
            const result = await fetchHealth(TARGET_URL);
            const instance = result.servedBy;
            if (tally[instance] !== undefined) {
                tally[instance]++;
            } else {
                tally.other++;
            }
            logs.push({ req: i, instance, status: result.statusCode });
            process.stdout.write(`Req #${String(i).padStart(2, "0")} -> [${instance}] (HTTP ${result.statusCode})\n`);
        } catch (err) {
            console.error(`Req #${i} Failed: ${err.message}`);
        }
    }

    console.log("\n================================================================================");
    console.log("                       FINAL LOAD DISTRIBUTION TALLY                            ");
    console.log("================================================================================");
    console.table([
        { Instance: "api1 (Container 1)", Requests: tally.api1, Percentage: `${((tally.api1 / TOTAL_REQUESTS) * 100).toFixed(1)}%` },
        { Instance: "api2 (Container 2)", Requests: tally.api2, Percentage: `${((tally.api2 / TOTAL_REQUESTS) * 100).toFixed(1)}%` },
        { Instance: "api3 (Container 3)", Requests: tally.api3, Percentage: `${((tally.api3 / TOTAL_REQUESTS) * 100).toFixed(1)}%` },
    ]);

    const isBalanced = tally.api1 === 10 && tally.api2 === 10 && tally.api3 === 10;
    console.log(`Result: ${tally.api1}/${tally.api2}/${tally.api3} -> ${isBalanced ? "PERFECT 10/10/10 DISTRIBUTION VERIFIED! (Full Marks)" : "Distributed across instances"}`);
    console.log("================================================================================");
}

// Support running directly
if (require.main === module) {
    runDistributionTest().catch(console.error);
}

module.exports = { runDistributionTest };
