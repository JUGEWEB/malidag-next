const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const languageMap = {
  af: "afr_Latn", am: "amh_Ethi", ar: "arb_Arab", az: "azj_Latn", be: "bel_Cyrl",
  bg: "bul_Cyrl", bn: "ben_Beng", bs: "bos_Latn", ca: "cat_Latn", ceb: "ceb_Latn",
  co: "cos_Latn", cs: "ces_Latn", cy: "cym_Latn", da: "dan_Latn", de: "deu_Latn",
  el: "ell_Grek", en: "eng_Latn", eo: "epo_Latn", es: "spa_Latn", et: "est_Latn",
  eu: "eus_Latn", fa: "pes_Arab", fi: "fin_Latn", fr: "fra_Latn", fy: "fry_Latn",
  ga: "gle_Latn", gl: "glg_Latn", gu: "guj_Gujr", ha: "hau_Latn", haw: "haw_Latn",
  he: "heb_Hebr", hi: "hin_Deva", hmn: "hmn_Latn", hr: "hrv_Latn", ht: "hat_Latn",
  hu: "hun_Latn", hy: "hye_Armn", id: "ind_Latn", ig: "ibo_Latn", is: "isl_Latn",
  it: "ita_Latn", ja: "jpn_Jpan", jw: "jav_Latn", ka: "kat_Geor", kk: "kaz_Cyrl",
  km: "khm_Khmr", kn: "kan_Knda", ko: "kor_Hang", ku: "kur_Arab", ky: "kir_Cyrl",
  la: "lat_Latn", lb: "ltz_Latn", lo: "lao_Laoo", lt: "lit_Latn", lv: "lvs_Latn",
  mg: "mlg_Latn", mi: "mri_Latn", mk: "mkd_Cyrl", ml: "mal_Mlym", mn: "khk_Cyrl",
  mr: "mar_Deva", ms: "zsm_Latn", mt: "mlt_Latn", my: "mya_Mymr", ne: "npi_Deva",
  nl: "nld_Latn", no: "nob_Latn", pa: "pan_Guru", pl: "pol_Latn", ps: "pbt_Arab",
  pt: "por_Latn", ro: "ron_Latn", ru: "rus_Cyrl", rw: "kin_Latn", sd: "snd_Arab",
  si: "sin_Sinh", sk: "slk_Latn", sl: "slv_Latn", sm: "smo_Latn", sn: "sna_Latn",
  so: "som_Latn", sq: "als_Latn", sr: "srp_Cyrl", st: "sot_Latn", su: "sun_Latn",
  sv: "swe_Latn", sw: "swh_Latn", ta: "tam_Taml", te: "tel_Telu", tg: "tgk_Cyrl",
  th: "tha_Thai", tk: "tuk_Latn", tl: "tgl_Latn", tr: "tur_Latn", tt: "tat_Cyrl",
  ug: "uig_Arab", uk: "ukr_Cyrl", ur: "urd_Arab", uz: "uzn_Latn", vi: "vie_Latn",
  xh: "xho_Latn", yi: "yid_Hebr", yo: "yor_Latn", zh: "zho_Hans", zu: "zul_Latn"
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
