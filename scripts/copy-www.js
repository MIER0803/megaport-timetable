const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const www = path.join(root, "www");
const files = [
  "index.html",
  "styles.css",
  "data.js",
  "schedule-full.js",
  "bio-loader.js",
  "app.js",
];

if (!fs.existsSync(www)) {
  fs.mkdirSync(www, { recursive: true });
}

for (const f of files) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) {
    console.error("缺少檔案:", f);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(www, f));
}

console.log("已複製靜態檔到 www/");
