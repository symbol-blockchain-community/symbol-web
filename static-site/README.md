# Symbol Static Site

This directory contains the complete website implementation used for GitHub Pages hosting.

## Requirements

- Node.js 20+
- npm

## Commands

- `npm run build` : build CSS + generate all static pages into `dist/`
- `npm run test` : build + check local links in generated HTML
- `npm run preview` : serve `dist/` locally
- `npm run new:article -- --locale=ja --category=news --slug=2026-02-release --title='Title'` : create a Markdown article file
- `npm run crawl:strapi` : optional sync from Strapi to Markdown files

## Content Structure

- `content/<locale>/news/*.md`
- `content/<locale>/community/*.md`
- `content/<locale>/docs/*.md`
- `content/<locale>/spaces.json`
- `content/i18n/<locale>.json`
- `content/images/*`

Locales: `en`, `ja`, `ko`, `zh`, `zh-hant-tw`

## Markdown Article Format

```md
---
title: Sample Title
description: Short summary for cards and metadata
createdAt: 2026-02-16T00:00:00.000Z
updatedAt: 2026-02-16T00:00:00.000Z
publishedAt: 2026-02-16T00:00:00.000Z
headerImage: ../images/sample.webp
localizations: []
---

# Heading

Body in Markdown.
```

## Editing Flow on GitHub

1. Create a branch.
2. Add or edit Markdown files under `content/<locale>/<category>/`.
3. If needed, add images under `content/images/`.
4. Run `npm run test` locally.
5. Open a Pull Request.

GitHub Actions validates build + links for every PR.
