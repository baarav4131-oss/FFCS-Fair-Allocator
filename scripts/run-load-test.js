/**
 * DA3 Q1(b) High-Concurrency Load Testing Utility
 * Sends 1,000 HTTP POST requests at concurrency 50 to POST /api/auth/login.
 * Matches hey output format: Req/sec, Avg Latency, p50, p90, p95, p99, and Status Code tally.
 */
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const TARGET_URL = process.env.TARGET_URL || "http://localhost:8080/api/auth/login";
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || "1000", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "50", 10);

const payloadPath = path.resolve(__dirname, "login-payload.json");
const payloadData = fs.existsSync(payloadPath)
    ? fs.readFileSync(payloadPath, "utf-8")
    : JSON.stringify({ email: "loadtest_student@vitstudent.ac.in", password: "Password123!" });

function sendSingleRequest(targetUrl, payload) {
    return new Promise((resolve) => {
        const parsed = url.parse(targetUrl);
        const startTime = process.hrtime();

        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port || 80,
            path: parsed.path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            },
            timeout: 5000
        }, (res) => {
            res.on("data", () => {});
            res.on("end", () => {
                const diff = process.hrtime(startTime);
                const durationMs = (diff[0] * 1e3) + (diff[1] / 1e6);
                resolve({
                    statusCode: res.statusCode,
                    durationMs,
                    upstream: res.headers["x-upstream"] || res.headers["x-served-by"] || "unknown"
                });
            });
        });

        req.on("error", (err) => {
            const diff = process.hrtime(startTime);
            const durationMs = (diff[0] * 1e3) + (diff[1] / 1e6);
            resolve({
                statusCode: 502, // Treat network connection error as 502 Bad Gateway
                durationMs,
                error: err.message
            });
        });

        req.write(payload);
        req.end();
    });
}

async function runLoadTest(options = {}) {
    const targetUrl = options.targetUrl || TARGET_URL;
    const total = options.total || TOTAL_REQUESTS;
    const concurrency = options.concurrency || CONCURRENCY;

    console.log("================================================================================");
    console.log(`  FFCS LOAD TEST: ${total} REQUESTS | CONCURRENCY: ${concurrency}               `);
    console.log(`  TARGET: ${targetUrl}                                                          `);
    console.log("================================================================================");

    const latencies = [];
    const statusCodes = {};
    let completed = 0;
    let inFlight = 0;
    let nextIndex = 0;

    const overallStart = Date.now();

    return new Promise((resolve) => {
        function launchNext() {
            if (completed >= total) {
                const overallDurationSec = (Date.now() - overallStart) / 1000;
                printResults(latencies, statusCodes, total, overallDurationSec, resolve);
                return;
            }

            while (inFlight < concurrency && nextIndex < total) {
                inFlight++;
                nextIndex++;

                sendSingleRequest(targetUrl, payloadData).then((res) => {
                    completed++;
                    inFlight--;

                    latencies.push(res.durationMs);
                    statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;

                    if (completed % 100 === 0 || completed === total) {
                        process.stdout.write(`Completed ${completed}/${total} requests (${Math.round((completed / total) * 100)}%)...\r`);
                    }

                    launchNext();
                });
            }
        }

        launchNext();
    });
}

function printResults(latencies, statusCodes, total, durationSec, resolve) {
    latencies.sort((a, b) => a - b);

    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = sum / latencies.length;
    const rps = (total / durationSec).toFixed(2);

    const p50 = latencies[Math.floor(latencies.length * 0.50)]?.toFixed(2);
    const p90 = latencies[Math.floor(latencies.length * 0.90)]?.toFixed(2);
    const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2);
    const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2);

    console.log("\n\nSummary:");
    console.log(`  Total Time:       ${durationSec.toFixed(3)} secs`);
    console.log(`  Requests/sec:     ${rps}`);
    console.log(`  Average Latency:  ${avg.toFixed(2)} ms`);
    console.log(`  p50 (Median):     ${p50} ms`);
    console.log(`  p90:              ${p90} ms`);
    console.log(`  p95:              ${p95} ms`);
    console.log(`  p99:              ${p99} ms`);
    console.log("\nStatus Code Distribution:");
    Object.keys(statusCodes).forEach(code => {
        console.log(`  [${code}]  ${statusCodes[code]} responses`);
    });
    console.log("================================================================================\n");

    resolve({
        total,
        durationSec,
        rps: parseFloat(rps),
        avgMs: parseFloat(avg.toFixed(2)),
        p50: parseFloat(p50),
        p90: parseFloat(p90),
        p95: parseFloat(p95),
        p99: parseFloat(p99),
        statusCodes
    });
}

if (require.main === module) {
    runLoadTest().catch(console.error);
}

module.exports = { runLoadTest };
