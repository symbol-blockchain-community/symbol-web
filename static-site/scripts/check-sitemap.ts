import * as fs from 'fs';
import * as path from 'path';

const DIST_DIR = path.join(__dirname, '..', 'dist');
interface SitemapIssue {
  sitemapFile: string;
  url: string;
  reason: string;
}

function resolveDistPathFromUrl(url: string): string {
  const parsed = new URL(url);
  const relativePath = parsed.pathname.replace(/^\/+/, '');

  if (parsed.pathname.endsWith('/')) {
    return relativePath.length > 0 ? path.join(DIST_DIR, relativePath, 'index.html') : path.join(DIST_DIR, 'index.html');
  }

  return relativePath.length > 0 ? path.join(DIST_DIR, relativePath) : path.join(DIST_DIR, 'index.html');
}

function collectSitemapFiles(entryFile: string, seen = new Set<string>()): string[] {
  if (seen.has(entryFile)) {
    return [];
  }

  seen.add(entryFile);
  const xml = fs.readFileSync(entryFile, 'utf-8');
  const sitemapLocMatches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);

  if (!xml.includes('<sitemapindex')) {
    return [entryFile];
  }

  const nestedFiles: string[] = [];
  for (const loc of sitemapLocMatches) {
    const parsed = new URL(loc);
    const nestedPath = path.join(DIST_DIR, parsed.pathname.replace(/^\/+/, ''));
    if (fs.existsSync(nestedPath)) {
      nestedFiles.push(...collectSitemapFiles(nestedPath, seen));
    }
  }

  return nestedFiles;
}

function checkSitemapFile(sitemapFile: string): SitemapIssue[] {
  const xml = fs.readFileSync(sitemapFile, 'utf-8');
  const urlMatches = Array.from(xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g), (match) => match[1]);
  const issues: SitemapIssue[] = [];

  for (const url of urlMatches) {
    let targetPath: string;

    try {
      targetPath = resolveDistPathFromUrl(url);
    } catch {
      issues.push({
        sitemapFile: path.relative(DIST_DIR, sitemapFile),
        url,
        reason: 'invalid URL in sitemap',
      });
      continue;
    }

    if (!fs.existsSync(targetPath)) {
      issues.push({
        sitemapFile: path.relative(DIST_DIR, sitemapFile),
        url,
        reason: `missing dist target: ${path.relative(DIST_DIR, targetPath) || 'index.html'}`,
      });
    }
  }

  return issues;
}

function main(): void {
  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error('sitemap.xml is missing. Run `npm run build` first.');
  }

  const sitemapFiles = collectSitemapFiles(sitemapPath);
  const issues = sitemapFiles.flatMap((file) => checkSitemapFile(file));

  if (issues.length === 0) {
    console.log(`Sitemap check passed for ${sitemapFiles.length} file(s).`);
    return;
  }

  console.error(`Found ${issues.length} sitemap issue(s):`);
  for (const issue of issues.slice(0, 200)) {
    console.error(`- ${issue.sitemapFile}: ${issue.url} -> ${issue.reason}`);
  }

  if (issues.length > 200) {
    console.error(`...and ${issues.length - 200} more.`);
  }

  process.exit(1);
}

main();
