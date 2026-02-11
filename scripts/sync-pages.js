// scripts/sync-pages.js
// Ajoute automatiquement les pages manquantes dans Navigation et Contrôle d’accès

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../app');
const NAV_FILE = path.join(__dirname, '../app/admin/navigation/page.tsx');
const ACCESS_FILE = path.join(__dirname, '../app/admin/access-control/page.tsx');

// Helper pour parcourir récursivement les dossiers et trouver tous les page.tsx
function findPages(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const relPath = path.join(base, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findPages(filePath, path.join(base, file)));
    } else if (file === 'page.tsx') {
      // Nettoie le chemin pour obtenir le path Next.js
      let route = relPath.replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
      if (!route.startsWith('/')) route = '/' + route;
      // Remplace /index par /
      route = route.replace(/\/index$/, '/');
      results.push(route);
    }
  });
  return results;
}

// Extraction des paths référencés dans Navigation
function extractNavPaths(navFile) {
  const content = fs.readFileSync(navFile, 'utf8');
  const regex = /href: '([^']+)'/g;
  const paths = [];
  let match;
  while ((match = regex.exec(content))) {
    paths.push(match[1]);
  }
  return paths;
}

// Extraction des paths référencés dans Contrôle d’accès
function extractAccessPaths(accessFile) {
  const content = fs.readFileSync(accessFile, 'utf8');
  const regex = /path: '([^']+)'/g;
  const paths = [];
  let match;
  while ((match = regex.exec(content))) {
    paths.push(match[1]);
  }
  return paths;
}

// Ajoute les nouveaux paths dans Navigation (dans la dernière section)
function appendToNavigation(navFile, newPaths) {
  let content = fs.readFileSync(navFile, 'utf8');
  // Cherche la dernière section.items
  const lastSectionMatch = /items: \[(?:[^\]]|\n)*?\]/g;
  let lastMatch;
  let match;
  while ((match = lastSectionMatch.exec(content))) {
    lastMatch = match;
  }
  if (!lastMatch) return;
  let insertPos = lastMatch.index + lastMatch[0].length - 1;
  // Génère les nouveaux items
  const newItems = newPaths.map(p => `\n      { label: '${p}', href: '${p}', icon: 'File', visible: true },`).join('');
  content = content.slice(0, insertPos) + newItems + content.slice(insertPos);
  fs.writeFileSync(navFile, content, 'utf8');
}

// Ajoute les nouveaux paths dans allPages (Contrôle d’accès)
function appendToAccessControl(accessFile, newPaths) {
  let content = fs.readFileSync(accessFile, 'utf8');
  const arrayMatch = /const allPages:[^=]+= \[(?:[^\]]|\n)*?\]/;
  const match = arrayMatch.exec(content);
  if (!match) return;
  let insertPos = match.index + match[0].length - 1;
  const newItems = newPaths.map(p => `\n  { path: '${p}', name: '${p}', category: 'Autre' },`).join('');
  content = content.slice(0, insertPos) + newItems + content.slice(insertPos);
  fs.writeFileSync(accessFile, content, 'utf8');
}

function main() {
  const allPages = findPages(APP_DIR);
  const navPaths = extractNavPaths(NAV_FILE);
  const accessPaths = extractAccessPaths(ACCESS_FILE);
  // Exclure les pages d’auth
  const exclude = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
  const missingNav = allPages.filter(p => !navPaths.includes(p) && !exclude.includes(p));
  const missingAccess = allPages.filter(p => !accessPaths.includes(p) && !exclude.includes(p));
  if (missingNav.length) appendToNavigation(NAV_FILE, missingNav);
  if (missingAccess.length) appendToAccessControl(ACCESS_FILE, missingAccess);
  console.log('Pages ajoutées à Navigation:', missingNav);
  console.log('Pages ajoutées à Contrôle d’accès:', missingAccess);
}

if (require.main === module) main();
