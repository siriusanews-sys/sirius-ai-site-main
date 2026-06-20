/**
 * Post-install patch for ajv-keywords@3 incompatibility with ajv@8.
 *
 * Problem:
 *   CRA 5.0.1 ships transitive deps (babel-loader, fork-ts-checker, file-loader)
 *   that pull `schema-utils@2/3` → `ajv-keywords@3` → calls `ajv._formats[name]`.
 *   In ajv@8 `ajv._formats` is undefined → TypeError: Cannot read properties
 *   of undefined (reading 'date').
 *
 * Fix:
 *   Patch every installed copy of `ajv-keywords/keywords/_formatLimit.js`
 *   to safely default `ajv._formats` to {} so the module load and keyword
 *   registration no longer crashes. The keyword logic itself is unused by
 *   webpack option validation (no schema uses formatMinimum/formatMaximum
 *   with date formats), so this defensive default is safe.
 *
 *   Also patch any nested `ajv-keywords/index.js` if present to be tolerant.
 */
const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden, .cache and .bin
      if (entry.name === '.cache' || entry.name === '.bin') continue;
      walk(full, files);
    } else if (entry.isFile() && entry.name === '_formatLimit.js' && full.includes(`${path.sep}ajv-keywords${path.sep}keywords${path.sep}`)) {
      files.push(full);
    }
  }
  return files;
}

const root = path.resolve(__dirname, '..', 'node_modules');
if (!fs.existsSync(root)) {
  console.log('[patch-ajv-keywords] node_modules not found, skipping.');
  process.exit(0);
}

const targets = walk(root);
let patched = 0;
for (const file of targets) {
  try {
    let src = fs.readFileSync(file, 'utf8');
    const before = src;
    // Make ajv._formats default to {} so ajv@8 (which lacks _formats) doesn't crash
    src = src.replace(
      /var formats = ajv\._formats;/g,
      'var formats = ajv._formats || {};'
    );
    if (src !== before) {
      fs.writeFileSync(file, src, 'utf8');
      patched++;
      console.log(`[patch-ajv-keywords] patched: ${path.relative(process.cwd(), file)}`);
    }
  } catch (e) {
    console.warn(`[patch-ajv-keywords] could not patch ${file}: ${e.message}`);
  }
}

console.log(`[patch-ajv-keywords] done. Files patched: ${patched}/${targets.length}`);
