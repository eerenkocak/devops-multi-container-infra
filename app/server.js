const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize PostgreSQL connection pool using environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Liveness probe / Healthcheck endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP" });
});

// Main application routing
app.get('/', async (req, res) => {
    try {
        const dbResponse = await pool.query('SELECT NOW()');
        res.status(200).json({
            status: "SUCCESS",
            payload: {
                message: "Application container is healthy and responding.",
                db_timestamp: dbResponse.rows[0].now
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "ERROR",
            payload: {
                message: "Internal core integration failure.",
                details: error.message
            }
        });
    }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    pool.end(() => {
        console.log('Database pool has ended.');
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`Server orchestration initializing on port ${PORT}`);
});
