/**
 * System Health Check & Diagnostics
 * --------------------------------------------------------------------------
 * Provides endpoints to verify database connectivity and system status.
 * Useful for DevOps monitoring (e.g., Docker healthchecks, AWS Load Balancers).
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Adjusted path to config

// --- GET: Database Connection Test ---
router.get("/db-check", async (req, res) => {
    try {
        // Simple query to verify Firebird connectivity
        // 'FIRST 1' is specific to Firebird syntax (equivalent to LIMIT 1)
        const sql = "SELECT FIRST 1 ID_OS, DT_OS FROM TB_OS";
        
        const start = Date.now();
        const result = await db.executeQuery(sql);
        const duration = Date.now() - start;

        res.json({
            status: "UP",
            database: "Firebird SQL",
            latency: `${duration}ms`,
            timestamp: new Date().toISOString(),
            sampleData: result.length > 0 ? "Data retrieved successfully" : "Table is empty"
        });

    } catch (err) {
        console.error("[Health Check Failed]:", err.message);
        res.status(500).json({
            status: "DOWN",
            error: "Database connection failed",
            details: err.message
        });
    }
});

module.exports = router;