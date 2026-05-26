const fs = require("fs");
const path = require("path");
const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate({
  keyFilename: "./translation-service.json",
});

const LANGS = [ "en", "fr"]; // other than 'en'
const basePath = path.join(__dirname, "../src/locales");

// Step 1: Load English base
const enPath = path.join(basePath, "en", "translation.json");
const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));

async function syncMissingTranslations() {
  for (const lang of LANGS) {
    const langPath = path.join(basePath, lang, "translation.json");
    let langData = {};

    if (fs.existsSync(langPath)) {
      langData = JSON.parse(fs.readFileSync(langPath, "utf8"));
    }

    const missingKeys = Object.keys(enData).filter((key) => !langData[key]);

    console.log(`🌐 [${lang}] Missing keys: ${missingKeys.length}`);

    for (const key of missingKeys) {
      try {
        const [translated] = await translate.translate(enData[key], lang);
        langData[key] = translated;
        console.log(`✔️ Translated '${key}' to ${lang}`);
      } catch (error) {
        console.error(`❌ Failed to translate '${key}' for ${lang}`, error);
      }
    }

    fs.mkdirSync(path.dirname(langPath), { recursive: true });
    fs.writeFileSync(langPath, JSON.stringify(langData, null, 2));
  }

  console.log("✅ All missing translations synced.");
}

syncMissingTranslations();
