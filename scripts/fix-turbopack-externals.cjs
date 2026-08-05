#!/usr/bin/env node
/**
 * Turbopack (Next 16) emits require("argon2-<contenthash>") for serverExternalPackages.
 * Node cannot resolve that name after deploy (node_modules has "argon2").
 * Rewrite hashed externals back to the real package name.
 * @see https://github.com/vercel/next.js/issues/89037
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(process.cwd(), ".next", "server");
const HASHED = /\b([A-Za-z0-9@/_.-]+)-[a-f0-9]{16}\b/g;
const PACKAGES = new Set(["argon2"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

let files = 0;
let replacements = 0;

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  const next = src.replace(HASHED, (full, name) => {
    if (!PACKAGES.has(name)) return full;
    replacements += 1;
    return name;
  });
  if (next !== src) {
    fs.writeFileSync(file, next);
    files += 1;
  }
}

console.log(
  `fix-turbopack-externals: ${replacements} replacement(s) in ${files} file(s)`,
);
