# symbol-web

This repository now contains a Markdown-first static site implementation under `static-site/`.

## Quick Start

```bash
npm --prefix static-site install
npm --prefix static-site run test
npm --prefix static-site run preview
```

## Content Editing

Articles are managed as Markdown files:

- `static-site/content/<locale>/news/*.md`
- `static-site/content/<locale>/community/*.md`
- `static-site/content/<locale>/docs/*.md`

Create a new article template:

```bash
npm --prefix static-site run new:article -- --locale=ja --category=news --slug=2026-02-release --title='Title'
```

See `static-site/README.md` for full details.
