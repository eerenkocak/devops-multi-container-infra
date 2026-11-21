const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_ENV = process.env.NODE_ENV || 'development';

// ---- 1. CLOUDWATCH STRUCTURED JSON LOGGER ----
function logStructured(level, message, meta = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        environment: APP_ENV,
        service: 'devops-multi-container-api',
        message,
        ...meta
    };
    const output = JSON.stringify(logEntry);
    if (level === 'ERROR' || level === 'ANOMALY') {
        console.error(output);
    } else {
        console.log(output);
    }
}

// ---- 2. STATISTICAL ANOMALY DETECTION ENGINE (Z-SCORE) ----
const telemetryState = {
    windowSize: 50,
    latencies: [],
    totalRequests: 0,
    errorCount: 0,
    anomalyCount: 0
};

function evaluateLatencyAnomaly(latencyMs, path) {
    telemetryState.totalRequests += 1;

    // Require at least 10 baseline samples before evaluating anomalies
    if (telemetryState.latencies.length >= 10) {
        const n = telemetryState.latencies.length;
        const mean = telemetryState.latencies.reduce((acc, val) => acc + val, 0) / n;
        const variance = telemetryState.latencies.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        // Flag anomaly if latency exceeds mean + 3 standard deviations (and > 50ms floor)
        const effectiveStdDev = Math.max(stdDev, 5);
        const zScore = (latencyMs - mean) / effectiveStdDev;

        if (zScore > 3.0 && latencyMs > 50) {
            telemetryState.anomalyCount += 1;
            logStructured('ANOMALY', 'Statistical latency anomaly detected via Z-Score analysis', {
                endpoint: path,
                observed_latency_ms: Number(latencyMs.toFixed(2)),
                baseline_mean_ms: Number(mean.toFixed(2)),
                z_score: Number(zScore.toFixed(2))
            });
        }
    }

    // Maintain sliding window of recent latencies
    telemetryState.latencies.push(latencyMs);
    if (telemetryState.latencies.length > telemetryState.windowSize) {
        telemetryState.latencies.shift();
    }
}

// ---- 3. TELEMETRY & ACCESS LOGGING MIDDLEWARE ----
app.use((req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const latencyMs = Number(endTime - startTime) / 1e6;

        if (res.statusCode >= 500) {
            telemetryState.errorCount += 1;
        }

        // Skip healthcheck noise from anomaly baseline
        if (req.path !== '/health') {
            evaluateLatencyAnomaly(latencyMs, req.path);
            logStructured('INFO', 'HTTP Request Processed', {
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
                latency_ms: Number(latencyMs.toFixed(2))
            });
        }
    });

    next();
});

// ---- 4. DATABASE CONNECTION POOL ----
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ---- 5. API ROUTES ----
// Liveness probe / Healthcheck endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', environment: APP_ENV });
});

// Live telemetry & anomaly metrics endpoint
app.get('/metrics', (req, res) => {
    const n = telemetryState.latencies.length;
    const avgLatency = n > 0
        ? telemetryState.latencies.reduce((a, b) => a + b, 0) / n
        : 0;

    res.status(200).json({
        environment: APP_ENV,
        total_requests: telemetryState.totalRequests,
        error_count: telemetryState.errorCount,
        anomalies_detected: telemetryState.anomalyCount,
        moving_avg_latency_ms: Number(avgLatency.toFixed(2)),
        sample_window: `${n}/${telemetryState.windowSize}`
    });
});

// Main application routing
app.get('/', async (req, res) => {
    try {
        const dbResponse = await pool.query('SELECT NOW()');
        res.status(200).json({
            status: 'SUCCESS',
            environment: APP_ENV,
            payload: {
                message: 'Application container is healthy and responding.',
                db_timestamp: dbResponse.rows[0].now
            }
        });
    } catch (error) {
        logStructured('ERROR', 'Database query execution failed', { error: error.message });
        res.status(500).json({
            status: 'ERROR',
            payload: {
                message: 'Internal core integration failure.',
                details: error.message
            }
        });
    }
});

// ---- 6. GRACEFUL SHUTDOWN ----
process.on('SIGTERM', () => {
    logStructured('INFO', 'SIGTERM received. Closing database connection pool...');
    pool.end(() => {
        logStructured('INFO', 'Database pool closed cleanly. Exiting.');
        process.exit(0);
    });
});

app.listen(PORT, () => {
    logStructured('INFO', `Server orchestration initialized on port ${PORT}`);
});
