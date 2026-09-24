import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webSrcDir = path.resolve(__dirname, '../src');

console.log('🔍 Running Frontend Route & Navigation Integrity Audit...\n');

function getAllSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllSourceFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllSourceFiles(webSrcDir);

// Forbidden un-prefixed routes that must start with /app/
const forbiddenPatterns = [
  {
    name: 'Unprefixed navigate()',
    regex: /navigate\(\s*['"`]\/(patients|appointments|doctors|specialties|reports|finance|settings|dashboard|calendar|stock)(\/|['"`])/g,
  },
  {
    name: 'Unprefixed window.location.href',
    regex: /window\.location\.href\s*=\s*['"`]\/(patients|appointments|doctors|specialties|reports|finance|settings|dashboard|calendar|stock)(\/|['"`])/g,
  },
  {
    name: 'Unprefixed <Link to=...>',
    regex: /<Link[^>]*to=['"`]\/(patients|appointments|doctors|specialties|reports|finance|settings|dashboard|calendar|stock)(\/|['"`])/g,
  },
];

const violations = [];

for (const filePath of allFiles) {
  // AppRouter.tsx contains intentional backward-compatibility redirect entries
  if (filePath.endsWith('AppRouter.tsx') || filePath.endsWith('AppLayout.tsx')) continue;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((lineText, index) => {
    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(lineText)) {
        violations.push({
          file: path.relative(webSrcDir, filePath),
          line: index + 1,
          type: pattern.name,
          code: lineText.trim(),
        });
      }
    }
  });
}

// ── Check Sidebar ────────────────────────────────────────────────────────────
const sidebarPath = path.join(webSrcDir, 'components/layout/Sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
  const content = fs.readFileSync(sidebarPath, 'utf-8');
  const pathMatches = [...content.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const p of pathMatches) {
    if (!p.startsWith('/app/')) {
      violations.push({
        file: 'components/layout/Sidebar.tsx',
        line: 0,
        type: 'Sidebar path must start with /app/',
        code: `path: '${p}'`,
      });
    }
  }
}

// ── Report Results ───────────────────────────────────────────────────────────
if (violations.length > 0) {
  console.error('❌ ROUTE INTEGRITY AUDIT FAILED! Found the following un-prefixed legacy routes:\n');
  violations.forEach((v) => {
    console.error(`   [${v.file}:${v.line}] (${v.type})`);
    console.error(`   > ${v.code}\n`);
  });
  console.error('👉 Fix all internal navigations to use canonical /app/... routes before building.\n');
  process.exit(1);
} else {
  console.log('✅ ROUTE INTEGRITY AUDIT PASSED: All internal navigations, links, and shortcuts use canonical /app/... routes.');
}
