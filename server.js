const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "countries_db",
  port: process.env.DB_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        capital VARCHAR(255),
        region VARCHAR(255),
        population BIGINT NOT NULL,
        currency_code VARCHAR(10),
        exchange_rate NUMERIC(20, 6),
        estimated_gdp NUMERIC(30, 2),
        flag_url TEXT,
        last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_region ON countries(region)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_currency ON countries(currency_code)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gdp ON countries(estimated_gdp)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS metadata (
        id INTEGER PRIMARY KEY DEFAULT 1,
        last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    await client.query(`
      INSERT INTO metadata (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

// Generate summary image
async function generateSummaryImage(stats) {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#eee";
  ctx.font = "bold 32px Arial";
  ctx.fillText("Country Database Summary", 50, 60);

  // Total countries
  ctx.font = "24px Arial";
  ctx.fillStyle = "#16c79a";
  ctx.fillText(`Total Countries: ${stats.totalCountries}`, 50, 120);

  // Last refreshed
  ctx.fillStyle = "#eee";
  ctx.font = "18px Arial";
  ctx.fillText(`Last Refreshed: ${stats.lastRefreshed}`, 50, 160);

  // Top 5 countries header
  ctx.fillStyle = "#eee";
  ctx.font = "bold 24px Arial";
  ctx.fillText("Top 5 Countries by GDP", 50, 220);

  // Top 5 list
  ctx.font = "18px Arial";
  let yPos = 260;
  stats.topCountries.forEach((country, index) => {
    ctx.fillStyle = "#16c79a";
    ctx.fillText(`${index + 1}. ${country.name}`, 70, yPos);
    ctx.fillStyle = "#eee";
    ctx.fillText(
      `GDP: $${parseFloat(country.estimated_gdp).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
      90,
      yPos + 25
    );
    yPos += 70;
  });

  // Save image
  const cacheDir = path.join(__dirname, "cache");
  await fs.mkdir(cacheDir, { recursive: true });
  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(path.join(cacheDir, "summary.png"), buffer);
}

// POST /countries/refresh
app.post("/countries/refresh", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch countries data
    const countriesResponse = await axios.get(
      "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies",
      { timeout: 10000 }
    );

    // Fetch exchange rates
    const ratesResponse = await axios.get(
      "https://open.er-api.com/v6/latest/USD",
      { timeout: 10000 }
    );

    const countries = countriesResponse.data;
    const rates = ratesResponse.data.rates;

    // Process each country
    for (const country of countries) {
      const name = country.name;
      const capital = country.capital || null;
      const region = country.region || null;
      const population = country.population || 0;
      const flagUrl = country.flag || null;

      let currencyCode = null;
      let exchangeRate = null;
      let estimatedGdp = null;

      // Handle currency
      if (country.currencies && country.currencies.length > 0) {
        currencyCode = country.currencies[0].code;

        if (rates[currencyCode]) {
          exchangeRate = rates[currencyCode];
          const randomMultiplier = Math.random() * (2000 - 1000) + 1000;
          estimatedGdp = (population * randomMultiplier) / exchangeRate;
        }
      } else {
        estimatedGdp = 0;
      }

      // Upsert country (insert or update)
      await client.query(
        `INSERT INTO countries 
         (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         ON CONFLICT (name) 
         DO UPDATE SET 
           capital = EXCLUDED.capital,
           region = EXCLUDED.region,
           population = EXCLUDED.population,
           currency_code = EXCLUDED.currency_code,
           exchange_rate = EXCLUDED.exchange_rate,
           estimated_gdp = EXCLUDED.estimated_gdp,
           flag_url = EXCLUDED.flag_url,
           last_refreshed_at = CURRENT_TIMESTAMP`,
        [
          name,
          capital,
          region,
          population,
          currencyCode,
          exchangeRate,
          estimatedGdp,
          flagUrl,
        ]
      );
    }

    // Update metadata
    await client.query(
      "UPDATE metadata SET last_refreshed_at = CURRENT_TIMESTAMP WHERE id = 1"
    );

    await client.query("COMMIT");

    // Generate summary image
    const countResult = await client.query(
      "SELECT COUNT(*) as total FROM countries"
    );
    const topCountries = await client.query(
      "SELECT name, estimated_gdp FROM countries WHERE estimated_gdp IS NOT NULL ORDER BY estimated_gdp DESC LIMIT 5"
    );
    const metaResult = await client.query(
      "SELECT last_refreshed_at FROM metadata WHERE id = 1"
    );

    await generateSummaryImage({
      totalCountries: parseInt(countResult.rows[0].total),
      topCountries: topCountries.rows,
      lastRefreshed: metaResult.rows[0].last_refreshed_at.toISOString(),
    });

    res.json({
      message: "Countries data refreshed successfully",
      total_countries: parseInt(countResult.rows[0].total),
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${
          error.config?.url || "external API"
        }`,
      });
    }

    if (error.response) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${
          error.config?.url || "external API"
        }`,
      });
    }

    console.error("Refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// GET /countries
app.get("/countries", async (req, res) => {
  try {
    const { region, currency, sort } = req.query;

    let query = "SELECT * FROM countries WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (region) {
      query += ` AND region = $${paramCount}`;
      params.push(region);
      paramCount++;
    }

    if (currency) {
      query += ` AND currency_code = $${paramCount}`;
      params.push(currency);
      paramCount++;
    }

    if (sort === "gdp_desc") {
      query += " ORDER BY estimated_gdp DESC NULLS LAST";
    } else if (sort === "gdp_asc") {
      query += " ORDER BY estimated_gdp ASC NULLS LAST";
    }

    const result = await pool.query(query, params);

    const formattedRows = result.rows.map((row) => ({
      ...row,
      population: parseInt(row.population),
      exchange_rate: row.exchange_rate ? parseFloat(row.exchange_rate) : null,
      estimated_gdp: row.estimated_gdp ? parseFloat(row.estimated_gdp) : null,
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error("Get countries error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /countries/:name
app.get("/countries/:name", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM countries WHERE LOWER(name) = LOWER($1)",
      [req.params.name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Country not found" });
    }

    const country = {
      ...result.rows[0],
      population: parseInt(result.rows[0].population),
      exchange_rate: result.rows[0].exchange_rate
        ? parseFloat(result.rows[0].exchange_rate)
        : null,
      estimated_gdp: result.rows[0].estimated_gdp
        ? parseFloat(result.rows[0].estimated_gdp)
        : null,
    };

    res.json(country);
  } catch (error) {
    console.error("Get country error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /countries/:name
app.delete("/countries/:name", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM countries WHERE LOWER(name) = LOWER($1)",
      [req.params.name]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Country not found" });
    }

    res.json({ message: "Country deleted successfully" });
  } catch (error) {
    console.error("Delete country error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /status
app.get("/status", async (req, res) => {
  try {
    const countResult = await pool.query(
      "SELECT COUNT(*) as total FROM countries"
    );
    const metaResult = await pool.query(
      "SELECT last_refreshed_at FROM metadata WHERE id = 1"
    );

    res.json({
      total_countries: parseInt(countResult.rows[0].total),
      last_refreshed_at: metaResult.rows[0].last_refreshed_at,
    });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /countries/image
app.get("/countries/image", async (req, res) => {
  try {
    const imagePath = path.join(__dirname, "cache", "summary.png");
    await fs.access(imagePath);
    res.sendFile(imagePath);
  } catch (error) {
    res.status(404).json({ error: "Summary image not found" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Country Currency API is running" });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await pool.end();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

module.exports = app;
