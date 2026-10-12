/**
 * Penjaga dark mode — `yarn lint:dark`.
 *
 * Latar: dark mode app ini bekerja lewat blok override terpusat di
 * src/app/globals.css (`.dark .bg-slate-50 { ... }`, dst). Setiap UI baru
 * yang memakai utilitas latar terang (bg-slate-50, bg-teal-50/70, ...)
 * WAJIB terdaftar di sana, kalau tidak: latar tetap terang sementara teks
 * ikut menjadi terang → tidak terlihat.
 *
 * Script ini memindai semua class di src dan melaporkan utilitas latar
 * terang yang (a) belum ada override-nya di globals.css DAN (b) tidak
 * dipasangkan dengan varian `dark:` di literal yang sama.
 * Keluar kode 1 bila ada temuan (gagalkan CI).
 *
 * Utilitas yang dikecualikan (sengaja tembus pandang / permukaan gelap
 * permanen): bg-white/<op>, bg-black/<op>, bg-transparent, bg-slate-900,
 * bg-slate-950, bg-slate-800.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const CSS = join(SRC, 'app', 'globals.css');

// Utilitas latar yang wajib bisa flip ke gelap.
const FLIP_RE = /\b(bg-(?:slate-(?:50|100)|teal-(?:50|100)|emerald-(?:50|100)|rose-(?:50|100)|amber-(?:50|100)|blue-(?:50|100)|white)(?:\/\d+)?)\b/g;
// Selalu gelap / tembus pandang — tidak perlu override. Termasuk shimmer
// dekoratif bg-teal-100/<op> di atas kartu gradien teal yang memang tidak flip.
const EXEMPT_RE = /^bg-(?:white\/\d+|black(?:\/\d+)?|transparent|teal-100\/\d+|slate-(?:800|900|950)(?:\/\d+)?)$/;

function collectFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      // shadcn/ui memakai token semantik (bg-card, ...) — tidak relevan.
      if (p.endsWith('components/ui')) continue;
      collectFiles(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

/** Kunci override dari blok `.dark ...` di globals.css. */
function loadOverrideKeys() {
  const css = readFileSync(CSS, 'utf8');
  const keys = new Set();
  for (const m of css.matchAll(/\.dark\s+\.([^\s,{]+)/g)) {
    let sel = m[1].replace(/\\\//g, '/').replace(/\\:/g, ':');
    sel = sel.replace(/:(hover|focus|active|disabled)$/, '');
    keys.add(sel);
  }
  return keys;
}

/** Belah teks jadi literal string ("...", '...', `...`). */
function stringLiterals(src) {
  const out = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push({ text: m[1], index: m.index });
  return out;
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

const overrides = loadOverrideKeys();
const problems = [];

for (const file of collectFiles(SRC)) {
  const src = readFileSync(file, 'utf8');
  for (const lit of stringLiterals(src)) {
    if (lit.text.includes('dark:')) continue; // dipasangkan manual → aman
    for (const m of lit.text.matchAll(FLIP_RE)) {
      const util = m[1];
      if (EXEMPT_RE.test(util)) continue;
      if (!overrides.has(util)) {
        problems.push(
          `${relative(ROOT, file)}:${lineOf(src, lit.index + m.index)} → ${util} (tanpa override .dark, tanpa varian dark:)`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error('Dark mode tidak ter-cover untuk:');
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\nPerbaiki: tambah varian dark: di elemennya, atau daftarkan override di src/app/globals.css.',
  );
  process.exit(1);
}
console.log('Dark mode OK — semua latar terang ter-cover.');
