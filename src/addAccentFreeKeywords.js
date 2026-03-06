const fs = require("fs");
const path = require("path");

// List of language codes (same as your project)
const LANGS = [
  "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy",
  "da", "de", "el", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd",
  "gl", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig",
  "is", "it", "ja", "jw", "ka", "kk", "km", "kn", "ko", "ku", "ky", "la", "lb",
  "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne",
  "nl", "no", "ny", "pa", "pl", "ps", "pt", "ro", "ru", "rw", "sd", "si", "sk",
  "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg",
  "th", "tk", "tl", "tr", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo",
  "zh", "zu"
];

// Path to keywords
const basePath = path.join(__dirname, "../src/locales");

// Utility: Remove accents
const removeAccents = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function addAccentFreeDuplicates() {
  for (const lang of LANGS) {
    const langFile = path.join(basePath, lang, "keywords.json");

    if (!fs.existsSync(langFile)) {
      console.warn(`⛔ No keywords file for ${lang}`);
      continue;
    }

    const original = JSON.parse(fs.readFileSync(langFile, "utf8"));
    let updated = false;

    for (const [key, value] of Object.entries(original)) {
      const clean = removeAccents(value);
      if (clean !== value) {
        const altKey = `${key}_alt`;
        if (!original[altKey]) {
          original[altKey] = clean;
          updated = true;
          console.log(`➕ [${lang}] ${altKey}: ${clean}`);
        }
      }
    }

    if (updated) {
      fs.writeFileSync(langFile, JSON.stringify(original, null, 2), "utf8");
      console.log(`💾 Updated: ${lang}/keywords.json`);
    } else {
      console.log(`✅ Already clean: ${lang}/keywords.json`);
    }
  }

  console.log("🏁 Done adding accent-free duplicates.");
}

addAccentFreeDuplicates();
