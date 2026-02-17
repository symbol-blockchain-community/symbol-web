import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const LOCALES = ['en', 'ja', 'ko', 'zh', 'zh-hant-tw'] as const;
const CATEGORIES = ['news', 'community', 'docs'] as const;

type Locale = (typeof LOCALES)[number];
type Category = (typeof CATEGORIES)[number];

interface Args {
  locale?: string;
  category?: string;
  slug?: string;
  title?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (const token of argv) {
    if (!token.startsWith('--')) continue;

    const [key, value = ''] = token.slice(2).split('=');
    if (key === 'locale') args.locale = value;
    if (key === 'category') args.category = value;
    if (key === 'slug') args.slug = value;
    if (key === 'title') args.title = value;
  }

  return args;
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-\s_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function assertLocale(value: string | undefined): Locale {
  if (!value || !LOCALES.includes(value as Locale)) {
    throw new Error(`Invalid --locale. Use one of: ${LOCALES.join(', ')}`);
  }
  return value as Locale;
}

function assertCategory(value: string | undefined): Category {
  if (!value || !CATEGORIES.includes(value as Category)) {
    throw new Error(`Invalid --category. Use one of: ${CATEGORIES.join(', ')}`);
  }
  return value as Category;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const locale = assertLocale(args.locale);
  const category = assertCategory(args.category);

  const title = args.title?.trim() || 'New article title';
  const slugInput = args.slug?.trim() || `${new Date().toISOString().slice(0, 10)}-${title}`;
  const slug = toSlug(slugInput);

  if (!slug) {
    throw new Error('Unable to build slug. Pass --slug explicitly.');
  }

  const dir = path.join(CONTENT_DIR, locale, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  const now = new Date().toISOString();

  const template = matter.stringify(
    [
      `# ${title}`,
      '',
      'Write your article body in Markdown.',
      '',
      '## Notes',
      '- Add links and images as needed.',
      '- Local images should be placed under `content/images/` and referenced like `../images/your-file.webp`.',
    ].join('\n'),
    {
      title,
      description: 'Short summary for list cards and metadata.',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      headerImage: '',
      localizations: [],
    }
  );

  fs.writeFileSync(filePath, template);

  console.log(`Created: ${path.relative(ROOT_DIR, filePath)}`);
  console.log('Next steps:');
  console.log('1) Edit title/description/front matter as needed');
  console.log('2) Write Markdown body');
  console.log('3) Run npm run build');
}

main();
