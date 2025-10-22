// server.js
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// In-memory storage
const stringStore = new Map();

// String analyzer function
function analyzeString(value) {
  const length = value.length;

  // Palindrome check (case-insensitive)
  const normalized = value.toLowerCase();
  const is_palindrome = normalized === normalized.split("").reverse().join("");

  // Unique characters
  const unique_characters = new Set(value).size;

  // Word count
  const word_count = value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // SHA-256 hash
  const sha256_hash = crypto.createHash("sha256").update(value).digest("hex");

  // Character frequency map
  const character_frequency_map = {};
  for (const char of value) {
    character_frequency_map[char] = (character_frequency_map[char] || 0) + 1;
  }

  return {
    length,
    is_palindrome,
    unique_characters,
    word_count,
    sha256_hash,
    character_frequency_map,
  };
}

// 1. POST /strings - Create/Analyze String
app.post("/strings", (req, res) => {
  const { value } = req.body;

  // Validation
  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'Missing "value" field' });
  }

  if (typeof value !== "string") {
    return res
      .status(422)
      .json({ error: 'Invalid data type for "value" (must be string)' });
  }

  // Check if string already exists
  if (stringStore.has(value)) {
    return res
      .status(409)
      .json({ error: "String already exists in the system" });
  }

  // Analyze string
  const properties = analyzeString(value);
  const record = {
    id: properties.sha256_hash,
    value,
    properties,
    created_at: new Date().toISOString(),
  };

  // Store
  stringStore.set(value, record);

  res.status(201).json(record);
});

// 2. GET /strings/:value - Get Specific String
app.get("/strings/:value", (req, res) => {
  const { value } = req.params;
  const record = stringStore.get(value);

  if (!record) {
    return res
      .status(404)
      .json({ error: "String does not exist in the system" });
  }

  res.status(200).json(record);
});

// 4. GET /strings/filter-by-natural-language - Natural Language Filtering
app.get("/strings/filter-by-natural-language", (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  const filters = {};
  const lower = query.toLowerCase();

  // Parse natural language queries
  if (lower.includes("palindrom")) {
    filters.is_palindrome = true;
  }

  if (lower.includes("single word")) {
    filters.word_count = 1;
  }

  const lengthMatch = lower.match(/longer than (\d+)/);
  if (lengthMatch) {
    filters.min_length = parseInt(lengthMatch[1]) + 1;
  }

  const shorterMatch = lower.match(/shorter than (\d+)/);
  if (shorterMatch) {
    filters.max_length = parseInt(shorterMatch[1]) - 1;
  }

  // Extract character to search for
  const charMatch = lower.match(
    /contain(?:s|ing)? (?:the letter |the )?([a-z])/
  );
  if (charMatch) {
    filters.contains_character = charMatch[1];
  }

  if (lower.includes("first vowel")) {
    filters.contains_character = "a";
  }

  // Apply filters
  let results = Array.from(stringStore.values());

  if (filters.is_palindrome !== undefined) {
    results = results.filter(
      (r) => r.properties.is_palindrome === filters.is_palindrome
    );
  }
  if (filters.min_length !== undefined) {
    results = results.filter((r) => r.properties.length >= filters.min_length);
  }
  if (filters.max_length !== undefined) {
    results = results.filter((r) => r.properties.length <= filters.max_length);
  }
  if (filters.word_count !== undefined) {
    results = results.filter(
      (r) => r.properties.word_count === filters.word_count
    );
  }
  if (filters.contains_character !== undefined) {
    results = results.filter((r) =>
      r.value.includes(filters.contains_character)
    );
  }

  res.status(200).json({
    data: results,
    count: results.length,
    interpreted_query: {
      original: query,
      parsed_filters: filters,
    },
  });
});

// 3. GET /strings - Get All Strings with Filtering
app.get("/strings", (req, res) => {
  const {
    is_palindrome,
    min_length,
    max_length,
    word_count,
    contains_character,
  } = req.query;

  let results = Array.from(stringStore.values());
  const filters_applied = {};

  // Apply filters
  if (is_palindrome !== undefined) {
    if (is_palindrome !== "true" && is_palindrome !== "false") {
      return res.status(400).json({ error: "Invalid value for is_palindrome" });
    }
    const isPalin = is_palindrome === "true";
    results = results.filter((r) => r.properties.is_palindrome === isPalin);
    filters_applied.is_palindrome = isPalin;
  }

  if (min_length !== undefined) {
    const min = parseInt(min_length);
    if (isNaN(min)) {
      return res.status(400).json({ error: "Invalid value for min_length" });
    }
    results = results.filter((r) => r.properties.length >= min);
    filters_applied.min_length = min;
  }

  if (max_length !== undefined) {
    const max = parseInt(max_length);
    if (isNaN(max)) {
      return res.status(400).json({ error: "Invalid value for max_length" });
    }
    results = results.filter((r) => r.properties.length <= max);
    filters_applied.max_length = max;
  }

  if (word_count !== undefined) {
    const wc = parseInt(word_count);
    if (isNaN(wc)) {
      return res.status(400).json({ error: "Invalid value for word_count" });
    }
    results = results.filter((r) => r.properties.word_count === wc);
    filters_applied.word_count = wc;
  }

  if (contains_character !== undefined) {
    if (
      typeof contains_character !== "string" ||
      contains_character.length !== 1
    ) {
      return res
        .status(400)
        .json({ error: "contains_character must be a single character" });
    }
    results = results.filter((r) => r.value.includes(contains_character));
    filters_applied.contains_character = contains_character;
  }

  res.status(200).json({
    data: results,
    count: results.length,
    filters_applied,
  });
});

// 5. DELETE /strings/:value - Delete String
app.delete("/strings/:value", (req, res) => {
  const { value } = req.params;

  if (!stringStore.has(value)) {
    return res
      .status(404)
      .json({ error: "String does not exist in the system" });
  }

  stringStore.delete(value);
  res.status(204).send();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
