// Prepares a trimmed copy of iaarabes/livuals into src-tauri/resources/livuals
// Excludes heavy dev artefacts like node_modules, dist, .svelte-kit, etc.

const fs = require('fs');
const path = require('path');

function rmrf(p) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function shouldIgnore(rel) {
  const parts = rel.split(path.sep);
  return (
    parts.includes('node_modules') ||
    parts.includes('.svelte-kit') ||
    parts.includes('dist') ||
    parts.includes('build') ||
    parts.includes('.vite') ||
    parts.includes('__pycache__')
  );
}

function copyDir(src, dst, base = src) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    const rel = path.relative(base, s);
    if (shouldIgnore(rel)) continue;
    if (entry.isDirectory()) {
      ensureDir(d);
      copyDir(s, d, base);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  // src-tauri/scripts -> src-tauri
  const srcTauriDir = path.resolve(__dirname, '..');
  // src-tauri -> desktop
  const desktopDir = path.resolve(srcTauriDir, '..');
  // desktop -> iaarabes (repo root)
  const repoRoot = path.resolve(desktopDir, '..');
  const livualsSrc = path.join(repoRoot, 'livuals');
  const dest = path.join(srcTauriDir, 'resources', 'livuals');

  if (!fs.existsSync(livualsSrc)) {
    console.warn(`[prepare-resources] Skipping: source not found: ${livualsSrc}`);
    return;
  }

  rmrf(dest);
  ensureDir(dest);
  copyDir(livualsSrc, dest);
  console.log(`[prepare-resources] Copied livuals -> ${dest}`);
}

main();

