---
name: issue-news-article-pr
description: Add publish-ready news articles from a GitHub issue to symbol-web without changing the provided article body, then validate and open a PR. Use this whenever a user asks to import issue text into static-site/content/*/news, especially for multi-locale localizations and strict no-edit-body requirements.
---

# Issue News Article PR

## Overview

Use this skill when content is provided in a GitHub Issue and must be registered as new `news` articles in `symbol-web`.
It preserves article text exactly, applies numeric ID routing for each locale, validates the static build, and prepares a PR.

## Non-Negotiable Rules

1. Never rewrite article body text for locales explicitly provided in the issue.
2. Keep punctuation, emojis, links, Markdown, and HTML tags exactly as given.
3. Treat separators such as `以下本文` / `本文以上まで` as control markers, not article body.
4. Do not "fix" date/title mismatches unless the user explicitly asks.
5. If publish metadata is required, add only metadata fields (`publishedAt` etc.); do not alter article sentences.
6. For locales not explicitly provided in the issue, generate translation from the base article according to the localization policy below.

## Required Inputs

- GitHub issue URL or issue number
- Target repo root (`symbol-web`)
- Target category (`news`, unless user requests another)
- Publish mode (`true` when user says "公開", "publish", or "トップに表示したい")

## Workflow

### 1) Read and Parse the Issue

- Fetch issue body using GitHub API.
- Identify:
  - Main article front matter (`title`, `description`, `headerImage`)
  - Main body section between markers
  - Localization blocks (`locale: en`, `locale: ko`, etc.) if present
- Keep extracted content byte-for-byte where possible.
- Build a locale coverage matrix for supported locales (`en`, `ja`, `ko`, `zh`, `zh-hant-tw`):
  - `provided`: locale block exists (or main body is `ja` base article)
  - `missing`: no locale block exists

### 2) Resolve Localization Policy

- If a locale is `provided`, use issue text exactly.
- If a locale is `missing`, auto-generate translation when publication expects multi-locale delivery.
- Choose one translation source locale from the `provided` locales (including the main `ja` base article) using this rule:
  1. Pick the locale with the most substantial article body ("most described language").
  2. Judge "most substantial" by body richness, not locale name priority:
     - Prefer the locale with clearly longer narrative sections/headings/lists.
     - Treat link-only or one-line stub blocks as lower richness.
  3. If two locales are effectively equivalent in richness, use this tie-breaker:
     - `en -> ja -> ko -> zh -> zh-hant-tw`
- Translation output rules for generated locales:
  - Preserve Markdown structure, links, HTML tags, and block structure.
  - Translate natural-language sentences only.
  - Do not alter URLs, code, or media references.
  - Keep provided locale files untouched even when they are shorter than the chosen source.

### 3) Decide IDs and Paths

- Inspect existing files: `static-site/content/<locale>/news/*.md`
- Determine next numeric IDs per locale.
- For a synchronized 5-locale set, use order:
  - `en -> ko -> zh -> zh-hant-tw -> ja`
- Write files at:
  - `static-site/content/en/news/<id>.md`
  - `static-site/content/ko/news/<id>.md`
  - `static-site/content/zh/news/<id>.md`
  - `static-site/content/zh-hant-tw/news/<id>.md`
  - `static-site/content/ja/news/<id>.md`

### 4) Create Article Files

Write front matter + body as follows:

- `provided` locales: use issue text exactly.
- `missing` locales: use generated translation from the selected base locale.

If publish mode is required, add these metadata fields to each locale file:

- `createdAt`: ISO timestamp
- `updatedAt`: same ISO timestamp
- `publishedAt`: same ISO timestamp
- `localizations`: IDs for the other locale files in the set
  - locale values: `en`, `ko`, `zh`, `zh-Hant-TW`, `ja-JP`

### 5) Validate Before PR

Run checks in this order (sequential, not parallel):

1. `npm --prefix static-site run build`
2. `npm --prefix static-site run test`

Then verify output visibility:

- Article pages exist in `static-site/dist/.../news/<id>.html`
- Top page latest-news cards contain the new IDs:
  - `static-site/dist/index.html` (en)
  - `static-site/dist/ja/index.html`
  - `static-site/dist/ko/index.html`
  - `static-site/dist/zh/index.html`
  - `static-site/dist/zh-hant-tw/index.html`
- For each locale, test top-page card navigation for:
  - at least one newly added article
  - at least one existing article
- If new and existing articles both fail in the same locale, classify it as a site routing/link-generation bug (not a content import issue) and fix before opening the PR.

Route note:
- English article path: `/news/<id>`
- Localized paths: `/<locale>/news/<id>`
- Example: Japanese `376` is `/ja/news/376`, not `/news/376`

### 6) Branch, Commit, and Open PR

1. Create branch with required prefix: `codex/<topic>`
2. Stage only intended content files.
3. Commit using Conventional Commits, e.g.:
   - `feat(content): add new localized news article set from issue #51`
4. Push branch and open PR.
5. In PR description, explicitly state:
   - Article body text was not modified
   - Which locales were issue-provided vs auto-translated
   - Build/test results
   - Locale ID mapping and paths

## Response Format To User

When work is done, report:

1. Added file list (absolute paths)
2. Locale -> ID mapping
3. Validation command outcomes (`build`, `test`)
4. URL/path confirmation notes (`/news/<id>` vs `/<locale>/news/<id>`)
5. PR URL

## Practical Defaults

- Assume `news` category unless explicitly overridden.
- Assume article text in issue is authoritative.
- For multilingual publication, if some supported locales are missing in the issue, auto-generate them by translating from the most substantial provided locale article (not fixed `en`-first).
- If publish intent is ambiguous:
  - If user asks for "公開", "反映", "トップ表示", treat as publish mode.
  - Otherwise create draft-style files without publish metadata.
