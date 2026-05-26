const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const languageMap = {
  en: "eng_Latn", fr: "fra_Latn"
};

const BASE_LANG = "eng_Latn";
const CONCURRENCY_LIMIT = 3;
const RETRY_DELAY = 5000; // 45 seconds

async function retry(fn, retries = 2, delay = RETRY_DELAY) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⏳ Retry ${attempt + 1}/${retries} after error: ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

async function processWithConcurrencyLimit(tasks, concurrency = CONCURRENCY_LIMIT) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const p = task();
    results.push(p);

    if (concurrency <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

app.post("/translate", async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: "Missing key or value" });

  try {
    const tasks = Object.entries(languageMap).map(([iso, nllb]) => async () => {
      const filePath = path.join(__dirname, "../src/locales", iso, "translation.json");
      const current = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : {};

      if (iso === "en") {
        current[key] = value;
        console.log(`✅ en translated.`);
      } else {
        try {
          const response = await retry(() =>
            axios.post("https://api.malidag.com/translation/translate", {
              text: value,
              source_lang: BASE_LANG,
              target_lang: nllb
            }, { timeout: 45000 })
          );

          current[key] = response.data.translation;
          console.log(`✅ ${iso} translated.`);
        } catch (err) {
          console.warn(`⚠️ Failed translating ${iso}: ${err.message}`);
          current[key] = "";
        }
      }

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(current, null, 2));
    });

    await processWithConcurrencyLimit(tasks);

    res.json({ success: true, message: "✅ Translation completed with concurrency limit." });
  } catch (err) {
    console.error("❌ Batch translation error:", err.message);
    res.status(500).json({ error: "Translation batch failed." });
  }
});

app.listen(4000, () => {
  console.log("✅ Translation API running on http://localhost:4000");
});
