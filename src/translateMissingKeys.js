const fs = require("fs");
const path = require("path");
const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate({
  keyFilename: "./translation-service.json",
});

const LANGS = ["af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy",
  "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga",
  "gd", "gl", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id",
  "ig", "is", "it", "ja", "jw", "ka", "kk", "km", "kn", "ko", "ku", "ky", "la",
  "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my",
  "ne", "nl", "no", "ny", "pa", "pl", "ps", "pt", "ro", "ru", "rw", "sd", "si",
  "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te",
  "tg", "th", "tk", "tl", "tr", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi",
  "yo", "zh", "zu"]; // other than 'en'
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
