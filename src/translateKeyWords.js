const fs = require("fs");
const path = require("path");
const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate({
  keyFilename: "./translation-service.json",
});

const LANGS = [
  "fr"
];

const basePath = path.join(__dirname, "../src/locales");
const keywordPath = path.join(__dirname, "keyWords.json");

const keyWords = JSON.parse(fs.readFileSync(keywordPath, "utf8"));

async function translateKeywords() {
  for (const lang of LANGS) {
    const langDir = path.join(basePath, lang);
    const langFile = path.join(langDir, "keywords.json");

    // Load existing file if it exists
    let existingTranslations = {};
    if (fs.existsSync(langFile)) {
      existingTranslations = JSON.parse(fs.readFileSync(langFile, "utf8"));
    }

    let updated = false;

    for (const [key, word] of Object.entries(keyWords)) {
      if (!existingTranslations[key]) {
        try {
          const [translated] = await translate.translate(word, lang);
          existingTranslations[key] = translated;
          console.log(`🆕 [${lang}] ${key}: ${word} → ${translated}`);
          updated = true;
        } catch (err) {
          console.error(`❌ Error translating '${word}' to ${lang}:`, err.message);
          existingTranslations[key] = word; // fallback
          updated = true;
        }
      }
    }

    if (updated) {
      fs.mkdirSync(langDir, { recursive: true });
      fs.writeFileSync(langFile, JSON.stringify(existingTranslations, null, 2));
      console.log(`💾 Saved updated ${lang}/keywords.json`);
    } else {
      console.log(`✅ ${lang} already up to date.`);
    }
  }

  console.log("✅ All missing keyword translations completed.");
}

translateKeywords();
