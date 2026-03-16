const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "/locales");

// languages to keep
const keep = ["en", "fr", "ar", "pt"];

fs.readdirSync(localesDir).forEach((folder) => {
  const fullPath = path.join(localesDir, folder);

  if (!keep.includes(folder)) {
    console.log("Deleting:", folder);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log("Locales cleaned ✔");