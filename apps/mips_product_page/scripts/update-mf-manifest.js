// apps/mips_product_page/scripts/update-mf-manifest.js
// Run: node ./scripts/update-mf-manifest.js [PUBLIC_URL]
// Example: node ./scripts/update-mf-manifest.js https://t2-web-1063861730054.europe-west1.run.app/

const fs = require("fs");
const path = require("path");

const PUBLIC_URL = (process.argv[2] || process.env.MF_PUBLIC_PATH || "https://t2-web-1063861730054.europe-west1.run.app/").replace(/\/+$/,"/");

const DIST = path.resolve(__dirname, "../dist");
const MANIFEST_FILE = path.join(DIST, "mf-manifest.json");

if (!fs.existsSync(MANIFEST_FILE)) {
  console.error("mf-manifest.json not found in", DIST);
  process.exit(2);
}

const m = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));

function absolute(p) {
  if (!p || typeof p !== "string") return p;
  if (/^(https?:)?\/\//.test(p)) return p; // already absolute
  // remove leading slashes to avoid double //
  return PUBLIC_URL + p.replace(/^\/+/, "");
}

// set metaData.publicPath
m.metaData = m.metaData || {};
m.metaData.publicPath = PUBLIC_URL;

// remoteEntry: if name is a relative path like "static/js/xxx.js", convert it
if (m.metaData.remoteEntry) {
  if (m.metaData.remoteEntry.name) {
    m.metaData.remoteEntry.name = absolute(m.metaData.remoteEntry.name);
  }
  if (m.metaData.remoteEntry.path) {
    m.metaData.remoteEntry.path = absolute(m.metaData.remoteEntry.path);
  }
}

// Fix shared assets
if (Array.isArray(m.shared)) {
  for (const s of m.shared) {
    if (s.assets && s.assets.js) {
      ["sync","async"].forEach(k => {
        if (Array.isArray(s.assets.js[k])) s.assets.js[k] = s.assets.js[k].map(absolute);
      });
    }
    if (s.assets && s.assets.css) {
      ["sync","async"].forEach(k => {
        if (Array.isArray(s.assets.css[k])) s.assets.css[k] = s.assets.css[k].map(absolute);
      });
    }
  }
}

// Fix exposes
if (Array.isArray(m.exposes)) {
  for (const e of m.exposes) {
    if (e.assets && e.assets.js) {
      ["sync","async"].forEach(k => {
        if (Array.isArray(e.assets.js[k])) e.assets.js[k] = e.assets.js[k].map(absolute);
      });
    }
    if (e.assets && e.assets.css) {
      ["sync","async"].forEach(k => {
        if (Array.isArray(e.assets.css[k])) e.assets.css[k] = e.assets.css[k].map(absolute);
      });
    }
  }
}

// If there are top-level arrays like "exposes" or other modules with module assets, try to convert them too:
if (Array.isArray(m.modules)) {
  for (const mod of m.modules) {
    if (mod.assets && mod.assets.js) {
      ["sync","async"].forEach(k => {
        if (Array.isArray(mod.assets.js[k])) mod.assets.js[k] = mod.assets.js[k].map(absolute);
      });
    }
    if (mod.assets && mod.assets.css) {
      ["sync","async"].forEach(k => {
        if (Array.isArray(mod.assets.css[k])) mod.assets.css[k] = mod.assets.css[k].map(absolute);
      });
    }
  }
}

// write back
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(m, null, 2), "utf8");
console.log("mf-manifest.json updated with publicPath:", PUBLIC_URL);
