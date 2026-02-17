import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const LOCALES = ['en', 'ja', 'ko', 'zh', 'zh-hant-tw'] as const;
const CATEGORIES = ['news', 'community', 'docs'] as const;

interface LegacyArticle {
  id?: number;
  title?: string;
  description?: string;
  body?: string;
  headerImage?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  localizations?: Array<{ locale: string; id: number }>;
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[>#*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fallbackDescription(markdown: string): string {
  const plain = stripMarkdown(markdown);
  if (plain.length <= 160) return plain;
  return `${plain.slice(0, 159).trim()}…`;
}

function migrateCategory(locale: string, category: string): number {
  const dir = path.join(CONTENT_DIR, locale, category);
  if (!fs.existsSync(dir)) return 0;

  const jsonFiles = fs.readdirSync(dir).filter((name) => name.endsWith('.json'));
  let converted = 0;

  for (const fileName of jsonFiles) {
    const sourcePath = path.join(dir, fileName);
    const fileText = fs.readFileSync(sourcePath, 'utf-8');
    const raw = JSON.parse(fileText) as LegacyArticle;

    const markdownBody = typeof raw.body === 'string' ? raw.body.trim() : '';
    const frontMatter = {
      title: raw.title || path.basename(fileName, '.json'),
      description: raw.description || fallbackDescription(markdownBody),
      createdAt: raw.createdAt || '',
      updatedAt: raw.updatedAt || '',
      publishedAt: raw.publishedAt || '',
      headerImage: raw.headerImage || '',
      localizations: Array.isArray(raw.localizations) ? raw.localizations : [],
    };

    const markdown = matter.stringify(markdownBody, frontMatter);
    const destinationPath = path.join(dir, `${path.basename(fileName, '.json')}.md`);

    fs.writeFileSync(destinationPath, markdown);
    fs.unlinkSync(sourcePath);
    converted += 1;
  }

  return converted;
}

function main(): void {
  let total = 0;

  for (const locale of LOCALES) {
    for (const category of CATEGORIES) {
      const count = migrateCategory(locale, category);
      total += count;
      if (count > 0) {
        console.log(`${locale}/${category}: converted ${count}`);
      }
    }
  }

  console.log(`Done. Total converted: ${total}`);
}

main();
