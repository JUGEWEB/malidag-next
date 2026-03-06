// routes/keywords.js
const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();
const KEYWORDS_FILE = path.join(__dirname, "keywords.json");

// Load existing keywords or create empty object
async function loadKeywords() {
  try {
    const data = await fs.readFile(KEYWORDS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save updated keywords
async function saveKeywords(keywords) {
  await fs.writeFile(KEYWORDS_FILE, JSON.stringify(keywords, null, 2));
}

// POST /add-missing-words
router.post("/add-missing-words", async (req, res) => {
  const { phrase } = req.body;

  if (!phrase || typeof phrase !== "string") {
    return res.status(400).json({ error: "Missing or invalid phrase." });
  }

  try {
    const words = phrase
      .toLowerCase()
      .replace(/[^\w\s']/g, "") // remove punctuation except apostrophes
      .split(/\s+/)
      .filter(Boolean);

    const keywords = await loadKeywords();
    const values = Object.values(keywords).map(w => w.toLowerCase());
    const added = [];
    const existing = [];

    for (const word of words) {
      if (values.includes(word)) {
        existing.push(word);
      } else if (!added.includes(word)) {
        const nextId = (Math.max(0, ...Object.keys(keywords).map(Number)) + 1).toString();
        keywords[nextId] = word;
        added.push(word);
      }
    }

    await saveKeywords(keywords);

    res.json({ existing, added });
  } catch (error) {
    console.error("❌ Failed to update keywords:", error);
    res.status(500).json({ error: "Internal error adding words." });
  }
});

module.exports = router;
