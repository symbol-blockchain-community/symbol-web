import * as fs from 'fs';
import * as path from 'path';

const DIST_DIR = path.join(__dirname, '..', 'dist');

interface BrokenRef {
  file: string;
  reference: string;
}

function walkHtmlFiles(dirPath: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function isSkippable(reference: string): boolean {
  return (
    reference.length === 0 ||
    reference.startsWith('#') ||
    reference.startsWith('http://') ||
    reference.startsWith('https://') ||
    reference.startsWith('mailto:') ||
    reference.startsWith('tel:') ||
    reference.startsWith('javascript:') ||
    reference.startsWith('data:')
  );
}

function normalizeReference(reference: string): string {
  const withoutHash = reference.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery;
}

function resolveReference(htmlFile: string, reference: string): string {
  const normalized = normalizeReference(reference);

  if (normalized.startsWith('/')) {
    const fromRoot = normalized.slice(1);
    if (normalized.endsWith('/')) {
      return path.join(DIST_DIR, fromRoot, 'index.html');
    }

    return path.join(DIST_DIR, fromRoot);
  }

  if (normalized.endsWith('/')) {
    return path.join(path.dirname(htmlFile), normalized, 'index.html');
  }

  return path.join(path.dirname(htmlFile), normalized);
}

function checkLinks(): BrokenRef[] {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist directory is missing. Run `npm run build` first.');
  }

  const htmlFiles = walkHtmlFiles(DIST_DIR);
  const broken: BrokenRef[] = [];

  const attrPattern = /(src|href)="([^"]+)"/g;

  for (const htmlFile of htmlFiles) {
    const body = fs.readFileSync(htmlFile, 'utf-8');
    const matches = body.matchAll(attrPattern);

    for (const match of matches) {
      const reference = match[2].trim();
      if (isSkippable(reference)) continue;

      const targetPath = resolveReference(htmlFile, reference);
      if (!fs.existsSync(targetPath)) {
        broken.push({
          file: path.relative(DIST_DIR, htmlFile),
          reference,
        });
      }
    }
  }

  return broken;
}

function main(): void {
  const broken = checkLinks();

  if (broken.length === 0) {
    console.log('Link check passed.');
    return;
  }

  console.error(`Found ${broken.length} broken local reference(s):`);
  for (const issue of broken.slice(0, 200)) {
    console.error(`- ${issue.file} -> ${issue.reference}`);
  }

  if (broken.length > 200) {
    console.error(`...and ${broken.length - 200} more.`);
  }

  process.exit(1);
}

main();
