/**
 * Post-install compatibility patches for CRA 5.0.1 + ajv@8 hoisting.
 *
 * Three known crashes are patched here:
 *
 * 1) ajv-keywords@3/keywords/_formatLimit.js
 *    `var formats = ajv._formats;` → undefined on ajv@8.
 *    We default it to `{}` so the keyword registration no longer crashes
 *    at module load.
 *
 * 2) @eslint/eslintrc/dist/eslintrc{,-universal}.cjs
 *    `ajv._opts.defaultMeta = ...` → `_opts` undefined on ajv@8.
 *    Guarded with `(ajv._opts = ajv._opts || {})`. Defensive only.
 *
 * 3) eslint@8 internally requires ajv@6 (`ajv/lib/refs/json-schema-draft-04.json`,
 *    legacy options like `missingRefs`, `schemaId: 'auto'`, `_opts.defaultMeta`).
 *    With ajv@8 hoisted at the root, eslint and @eslint/eslintrc crash.
 *    Fix: copy the nested `ajv@6` that yarn/npm already installs under
 *    `node_modules/ajv-keywords/node_modules/ajv` into:
 *      - node_modules/eslint/node_modules/ajv
 *      - node_modules/@eslint/eslintrc/node_modules/ajv
 *    so those packages resolve to their declared ajv@6 instead of root ajv@8.
 *
 * Safe to re-run; all operations are idempotent.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'node_modules');
if (!fs.existsSync(root)) {
  console.log('[patch-ajv-keywords] node_modules not found, skipping.');
  process.exit(0);
}

// ---------- helpers ----------
function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) { return files; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.cache' || entry.name === '.bin') continue;
      walk(full, files);
    } else if (entry.isFile()) {
      if (
        entry.name === '_formatLimit.js' &&
        full.includes(`${path.sep}ajv-keywords${path.sep}keywords${path.sep}`)
      ) {
        files.push({ file: full, type: 'ajv-keywords' });
      } else if (
        (entry.name === 'eslintrc.cjs' || entry.name === 'eslintrc-universal.cjs') &&
        full.includes(`${path.sep}@eslint${path.sep}eslintrc${path.sep}dist${path.sep}`)
      ) {
        files.push({ file: full, type: 'eslintrc' });
      }
    }
  }
  return files;
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sPath = path.join(src, entry.name);
    const dPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(sPath, dPath);
    } else if (entry.isSymbolicLink()) {
      try { fs.symlinkSync(fs.readlinkSync(sPath), dPath); } catch (_) {}
    } else {
      fs.copyFileSync(sPath, dPath);
    }
  }
  return true;
}

// ---------- 1 & 2: file rewrites ----------
const targets = walk(root);
let patched = 0;
for (const { file, type } of targets) {
  try {
    let src = fs.readFileSync(file, 'utf8');
    const before = src;
    if (type === 'ajv-keywords') {
      src = src.replace(
        /var formats = ajv\._formats;/g,
        'var formats = ajv._formats || {};'
      );
    } else if (type === 'eslintrc') {
      src = src.replace(
        /ajv\._opts\.defaultMeta = metaSchema\.id;/g,
        '(ajv._opts = ajv._opts || {}).defaultMeta = metaSchema.id;'
      );
    }
    if (src !== before) {
      fs.writeFileSync(file, src, 'utf8');
      patched++;
      console.log(`[patch-ajv-keywords] patched (${type}): ${path.relative(process.cwd(), file)}`);
    }
  } catch (e) {
    console.warn(`[patch-ajv-keywords] could not patch ${file}: ${e.message}`);
  }
}

// ---------- 3: provide nested ajv@6 to eslint and @eslint/eslintrc ----------
function findAjv6Source() {
  // Look anywhere under node_modules for a usable ajv@6 install.
  const candidates = [
    path.join(root, 'ajv-keywords', 'node_modules', 'ajv'),
  ];
  // Generic scan for any nested ajv directory whose package.json starts with "6."
  function scan(dir, depth = 0) {
    if (depth > 6) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      if (e.name === 'ajv') {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(full, 'package.json'), 'utf8'));
          if (pkg.version && pkg.version.startsWith('6.')) candidates.push(full);
        } catch (_) {}
      } else if (e.name === 'node_modules' || full.includes(`${path.sep}node_modules${path.sep}`)) {
        scan(full, depth + 1);
      }
    }
  }
  scan(root);
  for (const c of candidates) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(c, 'package.json'), 'utf8'));
      if (pkg.version && pkg.version.startsWith('6.')) {
        if (fs.existsSync(path.join(c, 'lib', 'refs', 'json-schema-draft-04.json'))) {
          return c;
        }
      }
    } catch (_) {}
  }
  return null;
}

const ajv6Source = findAjv6Source();
if (!ajv6Source) {
  console.warn('[patch-ajv-keywords] no nested ajv@6 found; eslint may still crash. Skipping ajv6 copy.');
} else {
  const consumers = [
    path.join(root, 'eslint'),
    path.join(root, '@eslint', 'eslintrc'),
  ];
  for (const consumer of consumers) {
    if (!fs.existsSync(consumer)) continue;
    const dest = path.join(consumer, 'node_modules', 'ajv');
    try {
      // Skip if already populated with v6
      let alreadyOk = false;
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));
        if (existing.version && existing.version.startsWith('6.')) alreadyOk = true;
      } catch (_) {}
      if (alreadyOk) continue;
      // Wipe any existing non-v6 install (e.g. a hoisted v8 by accident)
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
      copyRecursive(ajv6Source, dest);
      console.log(`[patch-ajv-keywords] installed ajv@6 into ${path.relative(process.cwd(), dest)}`);
    } catch (e) {
      console.warn(`[patch-ajv-keywords] could not install ajv@6 into ${dest}: ${e.message}`);
    }
  }
}

console.log(`[patch-ajv-keywords] done. File patches: ${patched}/${targets.length}`);
