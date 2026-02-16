import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const API_URL = 'https://cms.symbol-community.com';

const LOCALES: Record<string, string> = {
  en: 'en',
  ja: 'ja-JP',
  ko: 'ko',
  zh: 'zh',
  'zh-hant-tw': 'zh-Hant-TW',
};

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const IMAGES_DIR = path.join(CONTENT_DIR, 'images');

type Category = 'news' | 'community' | 'docs';

interface StrapiResponse<T> {
  data: Array<{ id: number; attributes: T }>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface BaseAttributes {
  title: string;
  body: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  headerImage?: {
    data?: {
      attributes: {
        url: string;
      };
    };
  };
  localizations?: {
    data: Array<{
      id: number;
      attributes: { locale: string };
    }>;
  };
}

interface SpaceAttributes {
  title: string;
  body: string;
  url: string;
  category: 'sns' | 'chat' | 'blog';
  platform: 'discord' | 'twitter' | 'slack' | 'web' | 'github';
}

const downloadedImages = new Set<string>();

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function clearMarkdownFiles(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;

  for (const fileName of fs.readdirSync(dirPath)) {
    if (fileName.endsWith('.md')) {
      fs.unlinkSync(path.join(dirPath, fileName));
    }
  }
}

async function downloadImage(imageUrl: string): Promise<string> {
  if (!imageUrl.startsWith('/')) {
    return imageUrl;
  }

  const fullUrl = `${API_URL}${imageUrl}`;
  const fileName = path.basename(imageUrl.split('?')[0]);
  const localPath = path.join(IMAGES_DIR, fileName);

  if (!downloadedImages.has(fullUrl)) {
    downloadedImages.add(fullUrl);

    if (!fs.existsSync(localPath)) {
      try {
        const response = await axios.get(fullUrl, { responseType: 'arraybuffer', timeout: 10000 });
        fs.writeFileSync(localPath, response.data);
      } catch {
        return fullUrl;
      }
    }
  }

  return `../images/${fileName}`;
}

async function normalizeMarkdownLinks(markdown: string): Promise<string> {
  const linkPattern = /\]\(([^)]+)\)/g;
  const matches = [...markdown.matchAll(linkPattern)];

  let result = markdown;

  for (const match of matches) {
    const original = match[1];
    if (!original.startsWith('/')) continue;

    const normalized = await downloadImage(original);
    result = result.replace(original, normalized);
  }

  return result;
}

async function fetchContent<T>(
  endpoint: string,
  locale: string,
  page: number = 1,
  pageSize: number = 100
): Promise<StrapiResponse<T>> {
  const url = `${API_URL}/api/${endpoint}`;
  const response = await axios.get(url, {
    params: {
      locale,
      populate: '*',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'sort[0]': 'id:desc',
    },
  });

  return response.data as StrapiResponse<T>;
}

async function fetchAllContent<T>(endpoint: string, strapiLocale: string): Promise<Array<{ id: number; attributes: T }>> {
  const allData: Array<{ id: number; attributes: T }> = [];
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const response = await fetchContent<T>(endpoint, strapiLocale, page);
    allData.push(...response.data);
    pageCount = response.meta.pagination.pageCount;
    page += 1;
  }

  return allData;
}

function writeArticle(categoryDir: string, id: number, attrs: BaseAttributes, body: string, headerImage: string): void {
  const frontMatterData = {
    title: attrs.title,
    description: attrs.description,
    createdAt: attrs.createdAt,
    updatedAt: attrs.updatedAt,
    publishedAt: attrs.publishedAt,
    headerImage,
    localizations:
      attrs.localizations?.data?.map((item) => ({
        locale: item.attributes.locale,
        id: item.id,
      })) || [],
  };

  const markdown = matter.stringify(body.trim(), frontMatterData);
  fs.writeFileSync(path.join(categoryDir, `${id}.md`), markdown);
}

async function crawlArticles(localeKey: string, strapiLocale: string, endpoint: string, category: Category): Promise<void> {
  const categoryDir = path.join(CONTENT_DIR, localeKey, category);
  ensureDirectory(categoryDir);
  clearMarkdownFiles(categoryDir);

  const articles = await fetchAllContent<BaseAttributes>(endpoint, strapiLocale);

  for (const article of articles) {
    const attrs = article.attributes;
    const body = await normalizeMarkdownLinks(attrs.body || '');

    let headerImage = '';
    if (attrs.headerImage?.data?.attributes?.url) {
      headerImage = await downloadImage(attrs.headerImage.data.attributes.url);
    }

    writeArticle(categoryDir, article.id, attrs, body, headerImage);
  }

  console.log(`  ${category}: ${articles.length} articles`);
}

async function crawlSpaces(localeKey: string, strapiLocale: string): Promise<void> {
  const spaces = await fetchAllContent<SpaceAttributes>('spaces', strapiLocale);

  const records = spaces.map((article) => ({
    id: article.id,
    title: article.attributes.title,
    body: article.attributes.body,
    url: article.attributes.url,
    category: article.attributes.category,
    platform: article.attributes.platform,
  }));

  fs.writeFileSync(path.join(CONTENT_DIR, localeKey, 'spaces.json'), JSON.stringify(records, null, 2));
  console.log(`  spaces: ${records.length} entries`);
}

async function main(): Promise<void> {
  console.log('Starting Strapi crawler...');

  ensureDirectory(IMAGES_DIR);

  for (const [localeKey, strapiLocale] of Object.entries(LOCALES)) {
    const localeDir = path.join(CONTENT_DIR, localeKey);
    ensureDirectory(localeDir);

    console.log(`\nLocale: ${localeKey}`);
    await crawlArticles(localeKey, strapiLocale, 'news-releases', 'news');
    await crawlArticles(localeKey, strapiLocale, 'community-releases', 'community');
    await crawlArticles(localeKey, strapiLocale, 'documents', 'docs');
    await crawlSpaces(localeKey, strapiLocale);
  }

  console.log(`\nDone. Downloaded images: ${downloadedImages.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
