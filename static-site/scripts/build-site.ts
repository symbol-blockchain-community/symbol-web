import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CSS_SOURCE = path.join(ROOT_DIR, 'css', 'output.css');
const ASSETS_SOURCE = path.join(ROOT_DIR, 'assets');
const IMAGES_SOURCE = path.join(CONTENT_DIR, 'images');

const LOCALES = ['en', 'ja', 'ko', 'zh', 'zh-hant-tw'] as const;
const CATEGORIES = ['news', 'community', 'docs'] as const;

type Locale = (typeof LOCALES)[number];
type Category = (typeof CATEGORIES)[number];

type I18n = Record<string, unknown>;

interface ImageIndex {
  byName: Set<string>;
  byStem: Map<string, string>;
}

interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  headerImage?: string;
  publishedAt: string;
  updatedAt?: string;
  createdAt?: string;
}

interface Space {
  id: number;
  title: string;
  body: string;
  url: string;
  category: 'sns' | 'chat' | 'blog';
  platform: 'discord' | 'twitter' | 'slack' | 'web' | 'github';
}

interface UiText {
  menu: string;
  links: string;
  community: string;
  viewAll: string;
  back: string;
  latestNews: string;
  latestCommunity: string;
  latestDocs: string;
  chat: string;
  sns: string;
  blog: string;
  startNow: string;
  learnMore: string;
  openDocs: string;
  editOnGitHub: string;
}

const UI_TEXT: Record<Locale, UiText> = {
  en: {
    menu: 'Menu',
    links: 'Links',
    community: 'Community',
    viewAll: 'View all',
    back: 'Back',
    latestNews: 'Latest News',
    latestCommunity: 'Community Updates',
    latestDocs: 'Featured Docs',
    chat: 'Chat',
    sns: 'Social',
    blog: 'Blogs',
    startNow: 'Start here',
    learnMore: 'Learn more',
    openDocs: 'Open docs',
    editOnGitHub: 'Edit on GitHub',
  },
  ja: {
    menu: 'メニュー',
    links: 'リンク',
    community: 'コミュニティ',
    viewAll: '一覧を見る',
    back: '戻る',
    latestNews: '最新ニュース',
    latestCommunity: 'コミュニティ最新情報',
    latestDocs: '注目ドキュメント',
    chat: 'チャット',
    sns: 'SNS',
    blog: 'ブログ',
    startNow: 'はじめ方',
    learnMore: '詳しく見る',
    openDocs: 'ドキュメントへ',
    editOnGitHub: 'GitHub で編集',
  },
  ko: {
    menu: '메뉴',
    links: '링크',
    community: '커뮤니티',
    viewAll: '전체 보기',
    back: '뒤로',
    latestNews: '최신 뉴스',
    latestCommunity: '커뮤니티 소식',
    latestDocs: '추천 문서',
    chat: '채팅',
    sns: 'SNS',
    blog: '블로그',
    startNow: '시작하기',
    learnMore: '자세히 보기',
    openDocs: '문서 열기',
    editOnGitHub: 'GitHub에서 편집',
  },
  zh: {
    menu: '菜单',
    links: '链接',
    community: '社区',
    viewAll: '查看全部',
    back: '返回',
    latestNews: '最新新闻',
    latestCommunity: '社区动态',
    latestDocs: '精选文档',
    chat: '聊天',
    sns: '社交',
    blog: '博客',
    startNow: '开始使用',
    learnMore: '了解更多',
    openDocs: '打开文档',
    editOnGitHub: '在 GitHub 编辑',
  },
  'zh-hant-tw': {
    menu: '選單',
    links: '連結',
    community: '社群',
    viewAll: '查看全部',
    back: '返回',
    latestNews: '最新消息',
    latestCommunity: '社群動態',
    latestDocs: '精選文件',
    chat: '聊天',
    sns: '社群',
    blog: '部落格',
    startNow: '開始使用',
    learnMore: '了解更多',
    openDocs: '開啟文件',
    editOnGitHub: '在 GitHub 編輯',
  },
};

function buildImageIndex(imagesDir: string): ImageIndex {
  const byName = new Set<string>();
  const byStem = new Map<string, string>();

  if (!fs.existsSync(imagesDir)) {
    return { byName, byStem };
  }

  for (const fileName of fs.readdirSync(imagesDir)) {
    const fullPath = path.join(imagesDir, fileName);
    if (!fs.statSync(fullPath).isFile()) continue;

    byName.add(fileName);
    const stem = fileName.replace(/\.[^.]+$/, '').toLowerCase();
    if (!byStem.has(stem)) {
      byStem.set(stem, fileName);
    }
  }

  return { byName, byStem };
}

const IMAGE_INDEX = buildImageIndex(IMAGES_SOURCE);

function asString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function text(i18n: I18n, key: string, fallback: string): string {
  const raw = i18n[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortText(content: string, max: number = 140): string {
  if (content.length <= max) return content;
  return `${content.slice(0, max - 1).trim()}…`;
}

function getRootPath(depth: number): string {
  if (depth <= 0) return './';
  return '../'.repeat(depth);
}

function localeIndexPath(locale: Locale, depth: number): string {
  const root = getRootPath(depth);
  return locale === 'en' ? `${root}index.html` : `${root}${locale}/index.html`;
}

function sectionPath(locale: Locale, isHome: boolean, depth: number, sectionId: string): string {
  return isHome ? `#${sectionId}` : `${localeIndexPath(locale, depth)}#${sectionId}`;
}

function formatDate(dateString: string, locale: Locale): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    'zh-hant-tw': 'zh-TW',
  };

  return date.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function normalizeBrokenHref(input: string): string {
  let href = input.trim();

  try {
    href = decodeURIComponent(href);
  } catch {
    // do nothing
  }

  const wrapped = href.match(/^\((https?:\/\/[^)]+)\)$/);
  if (wrapped) return wrapped[1];

  const malformed = href.match(/^\[https?:\/\]\((https?:\/\/[^)]+)\)\/?$/);
  if (malformed) return malformed[1];

  const malformedDouble = href.match(/^\[https?:\/\/\]\((https?:\/\/[^)]+)\)\/?$/);
  if (malformedDouble) return malformedDouble[1];

  const markdownLink = href.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)\/?$/);
  if (markdownLink) return markdownLink[1];

  return href;
}

function normalizeImageReference(reference: string): string | undefined {
  const trimmed = reference.trim().replace(/^\/+/, '');
  const noUploads = trimmed.replace(/^uploads\//, '');
  const baseName = path.basename(noUploads);

  if (IMAGE_INDEX.byName.has(baseName)) return baseName;

  const stem = baseName.replace(/\.[^.]+$/, '').toLowerCase();
  const mapped = IMAGE_INDEX.byStem.get(stem);
  if (mapped) return mapped;

  return undefined;
}

function toPublicImagePath(reference: string, depth: number): string | undefined {
  const fileName = normalizeImageReference(reference);
  if (!fileName) return undefined;
  return `${getRootPath(depth)}images/${fileName}`;
}

function resolveAssetPath(rawPath: string | undefined, depth: number): string | undefined {
  if (!rawPath) return undefined;
  const cleaned = normalizeBrokenHref(rawPath.trim());
  if (!cleaned) return undefined;

  if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith('mailto:') || cleaned.startsWith('tel:') || cleaned.startsWith('data:')) {
    return cleaned;
  }

  const root = getRootPath(depth);

  if (cleaned.startsWith('/uploads/')) {
    return toPublicImagePath(cleaned.slice('/uploads/'.length), depth);
  }

  const deepUploads = cleaned.match(/^(?:\.\.\/)+uploads\/(.+)$/);
  if (deepUploads) {
    return toPublicImagePath(deepUploads[1], depth);
  }

  if (cleaned.startsWith('/')) {
    return `${root}${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('../images/')) {
    return toPublicImagePath(cleaned.slice('../images/'.length), depth);
  }

  if (cleaned.startsWith('./images/')) {
    return toPublicImagePath(cleaned.slice('./images/'.length), depth);
  }

  if (cleaned.startsWith('images/')) {
    return toPublicImagePath(cleaned.slice('images/'.length), depth);
  }

  const deepImages = cleaned.match(/^(?:\.\.\/)+images\/(.+)$/);
  if (deepImages) {
    return toPublicImagePath(deepImages[1], depth);
  }

  if (cleaned.startsWith('../assets/')) {
    return `${root}assets/${cleaned.slice('../assets/'.length)}`;
  }

  if (cleaned.startsWith('./assets/')) {
    return `${root}assets/${cleaned.slice('./assets/'.length)}`;
  }

  if (cleaned.startsWith('assets/')) {
    return `${root}${cleaned}`;
  }

  if (!cleaned.includes('/') && !cleaned.includes('.')) {
    return undefined;
  }

  return cleaned;
}

function renderMarkdown(markdown: string, depth: number): string {
  const parsed = marked.parse(markdown, { gfm: true, breaks: false });
  const html = typeof parsed === 'string' ? parsed : '';

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'del']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'loading', 'decoding'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    transformTags: {
      a: (_tagName, attribs) => {
        const href = resolveAssetPath(attribs.href, depth);
        const safeAttribs: Record<string, string> = {};

        if (href) {
          safeAttribs.href = href;
          if (/^https?:\/\//.test(href)) {
            safeAttribs.target = '_blank';
            safeAttribs.rel = 'noopener noreferrer';
          }
        }

        return {
          tagName: 'a',
          attribs: safeAttribs,
        };
      },
      img: (_tagName, attribs) => {
        const src = resolveAssetPath(attribs.src, depth);
        return {
          tagName: 'img',
          attribs: {
            src: src || '',
            alt: attribs.alt || '',
            loading: 'lazy',
            decoding: 'async',
          },
        };
      },
    },
  });
}

function removeDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyDirectory(source: string, destination: string): void {
  ensureDirectory(destination);

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function loadI18n(locale: Locale): I18n {
  const filePath = path.join(CONTENT_DIR, 'i18n', `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as I18n;
}

function loadArticles(locale: Locale, category: Category): Article[] {
  const articlesDir = path.join(CONTENT_DIR, locale, category);
  if (!fs.existsSync(articlesDir)) return [];

  const files = fs
    .readdirSync(articlesDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const articles = files.map((fileName) => {
    const filePath = path.join(articlesDir, fileName);
    const file = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(file);
    const slug = path.basename(fileName, '.md');

    const title = asString(parsed.data.title, slug);
    const body = parsed.content.trim();
    const description = asString(parsed.data.description, shortText(stripMarkdown(body), 160));

    return {
      slug,
      title,
      description,
      body,
      headerImage: asString(parsed.data.headerImage, ''),
      publishedAt: asString(parsed.data.publishedAt, ''),
      updatedAt: asString(parsed.data.updatedAt, ''),
      createdAt: asString(parsed.data.createdAt, ''),
    };
  });

  return articles.sort((a, b) => {
    const aTime = new Date(a.publishedAt).getTime();
    const bTime = new Date(b.publishedAt).getTime();

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return b.slug.localeCompare(a.slug, undefined, { numeric: true });
    }

    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

function loadSpaces(locale: Locale): Space[] {
  const spacesPath = path.join(CONTENT_DIR, locale, 'spaces.json');
  if (!fs.existsSync(spacesPath)) return [];

  const spaces = JSON.parse(fs.readFileSync(spacesPath, 'utf-8')) as Space[];
  return Array.isArray(spaces) ? spaces : [];
}

function renderPlatformIcon(platform: Space['platform']): string {
  const icons: Record<Space['platform'], string> = {
    discord: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37A19.8 19.8 0 0 0 15.431 2.855a.074.074 0 0 0-.078.037c-.212.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.492.68-1.016.956-1.565a.076.076 0 0 0-.041-.106 13.12 13.12 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.247-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.126.1.247.198.373.292a.077.077 0 0 1-.006.127 12.28 12.28 0 0 1-1.873.892.077.077 0 0 0-.041.107c.275.549.595 1.073.955 1.565a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="m18.244 2.25 3.308 0-7.227 8.26 8.502 11.24-6.657 0-5.214-6.817L4.99 21.75l-3.31 0 7.731-8.835L1.254 2.25l6.827 0 4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg>',
    slack: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M5.042 15.165a2.528 2.528 0 1 1-2.52-2.52h2.52v2.52Zm1.271 0a2.527 2.527 0 0 1 5.042 0v6.313a2.528 2.528 0 1 1-5.042 0v-6.313ZM8.834 5.042a2.528 2.528 0 1 1 2.521-2.52v2.52H8.834Zm0 1.271a2.528 2.528 0 0 1 0 5.042H2.522A2.528 2.528 0 1 1 2.522 6.313h6.312Zm10.122 2.521a2.528 2.528 0 1 1 2.522 2.521h-2.522V8.834Zm-1.268 0a2.528 2.528 0 0 1-5.043 0V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312Zm-2.523 10.122a2.528 2.528 0 1 1 0 5.044h-2.52v-2.522h2.52Zm0-1.268a2.527 2.527 0 0 1 0-5.043h6.313A2.527 2.527 0 1 1 21.478 17.688h-6.313Z"/></svg>',
    web: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 12h18M12 3a15.3 15.3 0 0 1 0 18M12 3a15.3 15.3 0 0 0 0 18"/><circle cx="12" cy="12" r="9"/></svg>',
    github: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12a12 12 0 0 0 8.207 11.387c.6.111.793-.261.793-.577v-2.234C5.662 21.302 4.967 19.16 4.967 19.16c-.546-1.387-1.334-1.757-1.334-1.757-1.089-.744.084-.729.084-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.469-2.381 1.237-3.221-.124-.304-.535-1.525.117-3.176 0 0 1.008-.322 3.301 1.23a11.45 11.45 0 0 1 6.009 0c2.291-1.552 3.299-1.23 3.299-1.23.653 1.651.242 2.872.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.48 5.92.431.372.824 1.103.824 2.223v3.293c0 .319.192.694.8.576A12.002 12.002 0 0 0 24 12c0-6.627-5.373-12-12-12Z"/></svg>',
  };

  return icons[platform] || icons.web;
}

function renderLanguageMenu(currentLocale: Locale, depth: number): string {
  const languageNames: Record<Locale, string> = {
    en: 'English',
    ja: '日本語',
    ko: '한국어',
    zh: '简体中文',
    'zh-hant-tw': '繁體中文',
  };

  return LOCALES.map((locale) => {
    const href = localeIndexPath(locale, depth);
    const current = locale === currentLocale ? ' aria-current="true"' : '';
    return `<a href="${href}"${current}>${languageNames[locale]}</a>`;
  }).join('');
}

function renderHeader(locale: Locale, i18n: I18n, depth: number, isHomePage: boolean): string {
  const ui = UI_TEXT[locale];
  const root = getRootPath(depth);

  const navItems = [
    { id: 'features', label: text(i18n, 'functionary_section_title', 'Features') },
    { id: 'news', label: text(i18n, 'news_title', 'News') },
    { id: 'community', label: text(i18n, 'community_title', 'Community') },
    { id: 'docs', label: text(i18n, 'docs_title', 'Docs') },
    { id: 'start', label: text(i18n, 'start_title', ui.startNow) },
  ];

  const navLinks = navItems
    .map((item) => `<a class="nav-link" href="${sectionPath(locale, isHomePage, depth, item.id)}">${escapeHtml(item.label)}</a>`)
    .join('');

  const mobileLinks = navItems
    .map((item) => `<a href="${sectionPath(locale, isHomePage, depth, item.id)}">${escapeHtml(item.label)}</a>`)
    .join('');

  return `<header class="site-header">
  <div class="container site-header-inner">
    <a class="brand" href="${localeIndexPath(locale, depth)}">
      <img src="${root}assets/symbol-logo.webp" alt="Symbol" />
    </a>
    <nav class="main-nav" aria-label="Main">${navLinks}</nav>
    <div class="header-actions">
      <details class="lang-switch">
        <summary class="lang-summary">${escapeHtml(text(i18n, 'language', 'Language'))}</summary>
        <div class="lang-menu">${renderLanguageMenu(locale, depth)}</div>
      </details>
      <details class="mobile-drawer">
        <summary class="menu-toggle">${ui.menu}</summary>
        <nav class="mobile-nav" aria-label="Mobile">${mobileLinks}</nav>
      </details>
    </div>
  </div>
</header>`;
}

function renderFooter(locale: Locale, i18n: I18n, depth: number): string {
  const ui = UI_TEXT[locale];
  return `<footer class="site-footer">
  <div class="container site-footer-inner">
    <div>
      <h3 class="section-title" style="font-size:1.2rem;margin-bottom:0.5rem;">Symbol Community</h3>
      <p class="section-description" style="margin-top:0;">${escapeHtml(text(i18n, 'meta_page_description', 'Official and community-driven news around Symbol.'))}</p>
      <p class="footer-copy">${escapeHtml(text(i18n, 'footer_copyright', '© Symbol Community. All rights reserved.'))}</p>
    </div>
    <div>
      <h4>${ui.links}</h4>
      <ul>
        <li><a href="https://docs.symbol.dev/" target="_blank" rel="noopener">Symbol Documentation</a></li>
        <li><a href="https://github.com/symbol" target="_blank" rel="noopener">GitHub</a></li>
        <li><a href="https://symbol-community.com/" target="_blank" rel="noopener">Community Portal</a></li>
      </ul>
    </div>
    <div>
      <h4>${ui.community}</h4>
      <ul>
        <li><a href="https://discord.gg/JTxYPVTf" target="_blank" rel="noopener">Discord</a></li>
        <li><a href="https://twitter.com/nemsymbol" target="_blank" rel="noopener">X / Twitter</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

function renderArticleCard(article: Article, href: string, locale: Locale, depth: number, delayClass: string = ''): string {
  const image = resolveAssetPath(article.headerImage, depth);
  const cardMedia = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async"/>`
    : '<div class="article-placeholder" aria-hidden="true"></div>';

  return `<a class="article-card reveal ${delayClass}" href="${href}">
  ${cardMedia}
  <div class="article-card-body">
    <div class="article-date">${escapeHtml(formatDate(article.publishedAt, locale))}</div>
    <h3>${escapeHtml(article.title)}</h3>
    <p>${escapeHtml(shortText(article.description, 120))}</p>
  </div>
</a>`;
}

function renderHomePage(locale: Locale, i18n: I18n, news: Article[], community: Article[], docs: Article[], spaces: Space[]): string {
  const ui = UI_TEXT[locale];
  const root = getRootPath(locale === 'en' ? 0 : 1);
  const depth = locale === 'en' ? 0 : 1;
  const docsTitle = text(i18n, 'docs_title', 'Docs');

  const featureCards = [
    {
      icon: `${root}assets/puzzle.webp`,
      title: text(i18n, 'functionary_title1', 'Robustness and flexibility'),
      subtitle: text(i18n, 'functionary_body1', ''),
    },
    {
      icon: `${root}assets/ticket.webp`,
      title: text(i18n, 'functionary_title2', 'Built-in transaction patterns'),
      subtitle: text(i18n, 'functionary_body2', ''),
    },
    {
      icon: `${root}assets/token.webp`,
      title: text(i18n, 'functionary_title3', 'Easy asset operations'),
      subtitle: text(i18n, 'functionary_body3', ''),
    },
  ]
    .map(
      (item, index) => `<article class="feature-card reveal delay-${index}">
    <img src="${item.icon}" alt="" />
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.subtitle)}</p>
  </article>`
    )
    .join('');

  const secureCards = [
    {
      icon: `${root}assets/security.webp`,
      title: text(i18n, 'secure_title1', 'Secure multi-signature'),
      body: text(i18n, 'secure_body1', ''),
    },
    {
      icon: `${root}assets/network.webp`,
      title: text(i18n, 'secure_title2', 'Reliable layered network'),
      body: text(i18n, 'secure_body2', ''),
    },
    {
      icon: `${root}assets/gear.webp`,
      title: text(i18n, 'secure_title3', 'PoS+ consensus'),
      body: text(i18n, 'secure_body3', ''),
    },
  ]
    .map(
      (item, index) => `<article class="info-card reveal delay-${index}">
    <img src="${item.icon}" alt="" />
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.body)}</p>
  </article>`
    )
    .join('');

  const chatSpaces = spaces.filter((space) => space.category === 'chat');
  const snsSpaces = spaces.filter((space) => space.category === 'sns');
  const blogSpaces = spaces.filter((space) => space.category === 'blog');

  const communityLists = [
    { title: text(i18n, 'community_section_chat', ui.chat), items: chatSpaces },
    { title: text(i18n, 'community_section_twitter', ui.sns), items: snsSpaces },
    { title: text(i18n, 'community_section_blog', ui.blog), items: blogSpaces },
  ]
    .map((section, index) => {
      const links =
        section.items.length > 0
          ? section.items
              .map(
                (item) => `<li>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
            <span>${renderPlatformIcon(item.platform)}</span>${escapeHtml(item.title)}
          </a>
        </li>`
              )
              .join('')
          : `<li><div class="empty-state">No items yet.</div></li>`;

      return `<article class="community-card reveal delay-${index}">
      <h3>${escapeHtml(section.title)}</h3>
      <ul class="community-list">${links}</ul>
    </article>`;
    })
    .join('');

  const steps = [
    text(i18n, 'start_card1', 'Choose your wallet'),
    text(i18n, 'start_card2', 'Learn security basics'),
    text(i18n, 'start_card3', 'Join community support'),
    text(i18n, 'start_card4', 'Start developing'),
  ]
    .map(
      (label, index) => `<article class="step-card reveal delay-${index}">
    <h3>${escapeHtml(label)}</h3>
    <p>${escapeHtml(text(i18n, 'easy_section_body', 'Start in minutes with practical guides and references.'))}</p>
  </article>`
    )
    .join('');

  const docsCards = docs
    .slice(0, 3)
    .map((article, index) => renderArticleCard(article, `docs/${encodeURIComponent(article.slug)}.html`, locale, depth, `delay-${index}`))
    .join('');

  const newsCards = news
    .slice(0, 6)
    .map((article, index) => renderArticleCard(article, `news/${encodeURIComponent(article.slug)}.html`, locale, depth, `delay-${index % 4}`))
    .join('');

  const communityCards = community
    .slice(0, 6)
    .map((article, index) => renderArticleCard(article, `community/${encodeURIComponent(article.slug)}.html`, locale, depth, `delay-${index % 4}`))
    .join('');

  const heroDescription = text(i18n, 'meta_page_description', 'Community-curated updates, docs, and practical guides around Symbol.');

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(text(i18n, 'meta_page_title', 'Symbol Community'))}</title>
  <meta name="description" content="${escapeHtml(heroDescription)}" />
  <meta property="og:title" content="${escapeHtml(text(i18n, 'meta_page_title', 'Symbol Community'))}" />
  <meta property="og:description" content="${escapeHtml(heroDescription)}" />
  <link href="${root}css/output.css" rel="stylesheet" />
</head>
<body>
  ${renderHeader(locale, i18n, depth, true)}
  <main>
    <section class="hero">
      <div class="container hero-shell">
        <div class="hero-inner reveal">
          <span class="hero-kicker">Symbol Community</span>
          <h1 class="hero-title">${escapeHtml(text(i18n, 'title_message', 'A practical gateway to Symbol and NEM.'))}</h1>
          <p class="hero-subtitle">${escapeHtml(heroDescription)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="https://docs.symbol.dev/guides/account/creating-an-account.html" target="_blank" rel="noopener">${escapeHtml(
              text(i18n, 'title_button1', ui.learnMore)
            )}</a>
            <a class="btn btn-secondary" href="https://docs.symbol.dev/" target="_blank" rel="noopener">${escapeHtml(
              text(i18n, 'title_button2', ui.openDocs)
            )}</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title">${escapeHtml(text(i18n, 'history_title1', 'Why Symbol'))}</h2>
        <p class="section-description">${escapeHtml(text(i18n, 'history_body1', 'Symbol extends the original NEM vision with practical scalability and reliable transaction logic.'))}</p>
      </div>
    </section>

    <section id="features" class="section section-alt">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">${escapeHtml(text(i18n, 'functionary_section_title', 'Features'))}</h2>
        </div>
        <div class="feature-grid">${featureCards}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">${escapeHtml(text(i18n, 'secure_section_title', 'Security'))}</h2>
        </div>
        <div class="feature-grid">${secureCards}</div>
      </div>
    </section>

    <section id="news" class="section section-alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">${escapeHtml(text(i18n, 'news_title', ui.latestNews))}</h2>
            <p class="section-description">${escapeHtml(text(i18n, 'meta_page_description', heroDescription))}</p>
          </div>
          <a class="section-link" href="news/">${ui.viewAll}</a>
        </div>
        <div class="article-grid">${newsCards || '<div class="empty-state">No news yet.</div>'}</div>
      </div>
    </section>

    <section id="community" class="section">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">${escapeHtml(text(i18n, 'community_title', ui.latestCommunity))}</h2>
        </div>
        <div class="community-grid">${communityLists}</div>
        <div style="height:1.2rem"></div>
        <div class="section-head">
          <h3 class="section-title" style="font-size:1.45rem;">${escapeHtml(text(i18n, 'community_section_release', ui.latestCommunity))}</h3>
          <a class="section-link" href="community/">${ui.viewAll}</a>
        </div>
        <div class="article-grid">${communityCards || '<div class="empty-state">No community updates yet.</div>'}</div>
      </div>
    </section>

    <section id="docs" class="section section-alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">${escapeHtml(docsTitle)}</h2>
            <p class="section-description">${escapeHtml(text(i18n, 'easy_section_body', 'Build and learn with curated docs and practical references.'))}</p>
          </div>
          <a class="section-link" href="docs/">${ui.viewAll}</a>
        </div>
        <div class="article-grid">${docsCards || '<div class="empty-state">No docs yet.</div>'}</div>
      </div>
    </section>

    <section id="start" class="section">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">${escapeHtml(text(i18n, 'start_title', ui.startNow))}</h2>
        </div>
        <div class="steps-grid">${steps}</div>
      </div>
    </section>

    <section id="about" class="section section-alt">
      <div class="container">
        <h2 class="section-title">${escapeHtml(text(i18n, 'about_title', 'About this project'))}</h2>
        <p class="section-description">${escapeHtml(text(i18n, 'about_body', 'This website is maintained by community contributors.'))}</p>
        <p style="margin-top:1rem;">
          <a class="inline-link" href="https://github.com/symbol/symbol-web" target="_blank" rel="noopener">${ui.editOnGitHub}</a>
        </p>
      </div>
    </section>
  </main>
  ${renderFooter(locale, i18n, depth)}
</body>
</html>`;
}

function renderCategoryPage(locale: Locale, i18n: I18n, category: Category, articles: Article[]): string {
  const ui = UI_TEXT[locale];
  const depth = locale === 'en' ? 1 : 2;
  const root = getRootPath(depth);

  const categoryTitleMap: Record<Category, string> = {
    news: text(i18n, 'news_title', ui.latestNews),
    community: text(i18n, 'community_title', ui.latestCommunity),
    docs: text(i18n, 'docs_title', ui.latestDocs),
  };

  const cards = articles
    .map((article, index) => renderArticleCard(article, `${encodeURIComponent(article.slug)}.html`, locale, depth, `delay-${index % 4}`))
    .join('');

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(categoryTitleMap[category])} | ${escapeHtml(text(i18n, 'meta_page_title', 'Symbol Community'))}</title>
  <link href="${root}css/output.css" rel="stylesheet" />
</head>
<body>
  ${renderHeader(locale, i18n, depth, false)}
  <main class="page-main">
    <section class="page-hero">
      <div class="container">
        <a class="back-link" href="${localeIndexPath(locale, depth)}">← ${ui.back}</a>
        <h1 class="page-title">${escapeHtml(categoryTitleMap[category])}</h1>
        <p class="page-description">${escapeHtml(text(i18n, 'meta_page_description', 'Community updates and references.'))}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="article-grid">${cards || '<div class="empty-state">No articles yet.</div>'}</div>
      </div>
    </section>
  </main>
  ${renderFooter(locale, i18n, depth)}
</body>
</html>`;
}

function renderArticlePage(locale: Locale, i18n: I18n, category: Category, article: Article): string {
  const ui = UI_TEXT[locale];
  const depth = locale === 'en' ? 1 : 2;
  const root = getRootPath(depth);
  const cover = resolveAssetPath(article.headerImage, depth);
  const bodyHtml = renderMarkdown(article.body, depth);

  const categoryTitleMap: Record<Category, string> = {
    news: text(i18n, 'news_title', ui.latestNews),
    community: text(i18n, 'community_title', ui.latestCommunity),
    docs: text(i18n, 'docs_title', ui.latestDocs),
  };

  const articleDate = formatDate(article.publishedAt, locale);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(article.title)} | ${escapeHtml(text(i18n, 'meta_page_title', 'Symbol Community'))}</title>
  <meta name="description" content="${escapeHtml(article.description)}" />
  <link href="${root}css/output.css" rel="stylesheet" />
</head>
<body>
  ${renderHeader(locale, i18n, depth, false)}
  <main class="article-shell">
    <div class="container article-layout">
      <a class="back-link" href="${root}${category}/index.html">← ${ui.back}</a>
      <div class="article-header-card reveal">
        ${cover ? `<img class="article-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async" />` : ''}
        <div class="article-header">
          <div class="article-meta">${escapeHtml(categoryTitleMap[category])}${articleDate ? ` · ${escapeHtml(articleDate)}` : ''}</div>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="page-description">${escapeHtml(article.description)}</p>
        </div>
      </div>
      <article class="markdown-body reveal delay-1">
        ${bodyHtml}
      </article>
    </div>
  </main>
  ${renderFooter(locale, i18n, depth)}
</body>
</html>`;
}

function buildLocale(locale: Locale): void {
  const i18n = loadI18n(locale);
  const news = loadArticles(locale, 'news');
  const community = loadArticles(locale, 'community');
  const docs = loadArticles(locale, 'docs');
  const spaces = loadSpaces(locale);

  const outputDir = locale === 'en' ? DIST_DIR : path.join(DIST_DIR, locale);
  ensureDirectory(outputDir);

  const homeHtml = renderHomePage(locale, i18n, news, community, docs, spaces);
  fs.writeFileSync(path.join(outputDir, 'index.html'), homeHtml);

  const categoryMap: Record<Category, Article[]> = {
    news,
    community,
    docs,
  };

  for (const category of CATEGORIES) {
    const categoryDir = path.join(outputDir, category);
    ensureDirectory(categoryDir);

    const categoryHtml = renderCategoryPage(locale, i18n, category, categoryMap[category]);
    fs.writeFileSync(path.join(categoryDir, 'index.html'), categoryHtml);

    for (const article of categoryMap[category]) {
      const articleHtml = renderArticlePage(locale, i18n, category, article);
      fs.writeFileSync(path.join(categoryDir, `${article.slug}.html`), articleHtml);
    }
  }
}

function buildSite(): void {
  console.log('Building static site...');

  if (!fs.existsSync(CSS_SOURCE)) {
    throw new Error('CSS not found. Run `npm run build:css` first.');
  }

  if (!fs.existsSync(ASSETS_SOURCE)) {
    throw new Error('Assets folder is missing. Expected static-site/assets.');
  }

  removeDirectory(DIST_DIR);
  ensureDirectory(DIST_DIR);

  const cssTargetDir = path.join(DIST_DIR, 'css');
  ensureDirectory(cssTargetDir);
  fs.copyFileSync(CSS_SOURCE, path.join(cssTargetDir, 'output.css'));

  const imagesSource = path.join(CONTENT_DIR, 'images');
  if (fs.existsSync(imagesSource)) {
    copyDirectory(imagesSource, path.join(DIST_DIR, 'images'));
  }

  copyDirectory(ASSETS_SOURCE, path.join(DIST_DIR, 'assets'));

  for (const locale of LOCALES) {
    console.log(` - ${locale}`);
    buildLocale(locale);
  }

  console.log('Build complete.');
}

buildSite();
