---
name: issue-news-article-pr
description: Add publish-ready news articles from a GitHub issue to symbol-web without changing the provided article body, then validate and open a PR. Use this whenever a user asks to import issue text into static-site/content/*/news, especially for multi-locale localizations and strict no-edit-body requirements.
---

# Issue News Article PR

## Overview

Use this skill when content is provided in a GitHub Issue and must be registered as new `news` articles in `symbol-web`.
It preserves article text exactly, applies numeric ID routing for each locale, validates the static build, prepares a PR, and gates publish/update actions on approved issue authors and the required assignee.

## Non-Negotiable Rules

1. Never rewrite article body sentences for locales explicitly provided in the issue.
2. Keep punctuation, emojis, and non-image links exactly as given.
3. Treat separators such as `以下本文` / `本文以上まで` as control markers, not article body.
4. Do not "fix" date/title mismatches unless the user explicitly asks.
5. If publish metadata is required, add only metadata fields (`publishedAt` etc.); do not alter article sentences.
6. For locales not explicitly provided in the issue, generate translation from the base article according to the localization policy below.
7. External image URLs inside article body must be downloaded and stored in-repo (`static-site/content/images/`), then replaced with local references.
8. Before publishing or modifying article files, resolve the issue author's GitHub `login`, display `name`, numeric account id, and `authorAssociation`.
9. Proceed automatically only when the issue author is approved:
   - approved by default when `authorAssociation` is `OWNER`, `MEMBER`, or `COLLABORATOR`
   - otherwise require an explicit allowlist or user confirmation that matches both `login` and numeric account id
10. If author approval cannot be established, stop before writing files or opening a PR and report the author metadata to the user.
11. When running periodically or unattended, use only commands explicitly permitted by `./codex/rules/issue-news-article-pr.rules`.
12. Before any content work, confirm the issue assignees contain `ymuichiro` (GitHub account id `47295014`).
13. If `ymuichiro` is not assigned, run only `gh issue edit <number> --repo symbol-blockchain-community/symbol-web --add-assignee ymuichiro`, then stop without any other action.
14. If the issue is not a request to add, modify, or delete site article content, do not create files, edit files, validate, push, or open a PR. If needed, only add `ymuichiro` as assignee, then stop.
15. Once the assignee gate, scope gate, and author-approval gate pass, complete the publish flow autonomously through commit, push, and PR creation without pausing for extra confirmation.
16. For unattended periodic runs, stop after the PR is opened. Do not merge automatically unless the user explicitly asks for merge behavior.

## Required Inputs

- GitHub issue URL or issue number
- Target repo root (`symbol-web`)
- Target category (`news`, unless user requests another)
- Publish mode (`true` when user says "公開", "publish", or "トップに表示したい")
- Approved-author policy when the issue author is not covered by the default `authorAssociation` rule above
- Required assignee gate: `ymuichiro` (GitHub account id `47295014`)

## Command Inventory

Run commands as standalone invocations. Avoid chained shell scripts so `prefix_rule()` matching remains exact and auditable.
Do not use any command that is not already permitted by `./codex/rules/issue-news-article-pr.rules`.

1. Fetch issue body, state, author, and assignees:
   - `gh issue view <number> --repo symbol-blockchain-community/symbol-web --json number,title,body,url,state,author,assignees`
2. Add the required assignee and stop when the gate fails:
   - `gh issue edit <number> --repo symbol-blockchain-community/symbol-web --add-assignee ymuichiro`
3. Fetch issue author approval metadata:
   - `gh api graphql -f 'query=query($owner:String!, $name:String!, $number:Int!) { repository(owner:$owner, name:$name) { issue(number:$number) { number title url authorAssociation author { login __typename ... on User { databaseId name } } } } }' -f owner=symbol-blockchain-community -f name=symbol-web -F number=<number>`
4. Validate the rules file against a target command:
   - `codex execpolicy check --pretty --rules codex/rules/issue-news-article-pr.rules -- <command...>`
5. Install locked dependencies when needed:
   - `npm --prefix static-site ci`
6. Validate the site:
   - `npm --prefix static-site run build`
   - `npm --prefix static-site run test`
7. Prepare the branch and commit:
   - `git switch -c codex/<topic>`
   - `git status --short`
   - `git add <paths...>`
   - `git commit -m "<conventional commit>"`
8. Publish and review the PR:
   - `git push -u origin codex/<topic>`
   - `gh pr create --base main --head codex/<topic> --title "<title>" --body "<body>"`
   - `gh pr view <number> --json url,reviewDecision,mergeStateStatus,statusCheckRollup`
9. Merge after requirements are satisfied, but only when merge is explicitly requested:
   - `gh pr merge <number> --auto --squash --delete-branch`

## Workflow

### 0) Gate Scope and Assignee

- Fetch issue metadata before any content work:
  - `gh issue view <number> --repo symbol-blockchain-community/symbol-web --json number,title,body,url,state,author,assignees`
- Treat the issue as in-scope only when it clearly requests adding, modifying, or deleting site article content.
  - In-scope examples: publishing or updating Markdown articles under `static-site/content/<locale>/*/*.md`
  - Out-of-scope examples: code changes, CI, config, styling, infrastructure, repo rules, automation changes, unclear requests, or anything not about site article content
- If `ymuichiro` is not present in `assignees`, run only:
  - `gh issue edit <number> --repo symbol-blockchain-community/symbol-web --add-assignee ymuichiro`
  - Then stop immediately. Do not write files, validate, commit, push, open a PR, or merge.
- If the issue is out of scope:
  - If `ymuichiro` is already assigned, stop immediately with no other action.
  - If `ymuichiro` is not assigned, add the assignee as above, then stop immediately.
- Only continue when the issue is in scope and `ymuichiro` is already assigned.

### 1) Read and Parse the Issue

- Fetch issue body using GitHub API.
- Identify:
  - Current assignees and whether `ymuichiro` is already present
  - Issue author metadata: `login`, display `name`, numeric account id, `authorAssociation`
  - Main article front matter (`title`, `description`, `headerImage`)
  - Main body section between markers
  - Localization blocks (`locale: en`, `locale: ko`, etc.) if present
- Keep extracted content byte-for-byte where possible.
- Before any publish/update work, verify the author against the approval gate:
  - accept automatically for `OWNER`, `MEMBER`, `COLLABORATOR`
  - otherwise require an explicit approved-author match on both `login` and numeric account id
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
- For body images (Markdown image links and `<img src=\"...\">`):
  1. Download external image URLs.
  2. Store them under `static-site/content/images/` (prefer `.webp` format).
  3. Replace only image source URLs with `../images/<file>`.
  4. Keep all non-image links unchanged.

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
- Verify no external body image URL remains in new files (for example, no `github.com/user-attachments` references).
- If the workflow depends on new exec-policy rules, run `codex execpolicy check` for the issue-fetch, validation, push, PR-create, and PR-merge commands before relying on them.
- For unattended runs, do not stop for extra confirmation between file creation, validation, push, and PR creation.

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
6. Stop after opening the PR unless merge was explicitly requested.

## Response Format To User

When work is done, report:

1. Added file list (absolute paths)
2. Locale -> ID mapping
3. Validation command outcomes (`build`, `test`)
4. URL/path confirmation notes (`/news/<id>` vs `/<locale>/news/<id>`)
5. Issue author approval note (`login`, `name`, numeric account id, `authorAssociation`)
6. PR URL

If the workflow stops at the assignee gate or scope gate, report only:

1. Gate outcome (`out of scope` or `assignee added and stopped`)
2. Whether `ymuichiro` was already assigned or was added
3. The issue URL

## Practical Defaults

- Assume `news` category unless explicitly overridden.
- Assume article text in issue is authoritative.
- For multilingual publication, if some supported locales are missing in the issue, auto-generate them by translating from the most substantial provided locale article (not fixed `en`-first).
- Always migrate external body image URLs to local `content/images` assets.
- If `static-site/node_modules` is missing or stale, run `npm --prefix static-site ci` before `build` / `test`.
- Prefer exact standalone commands over compound shell wrappers so Codex rules can match the intended prefixes.
- For periodic runs, obey `./codex/rules/issue-news-article-pr.rules` strictly and do not improvise extra commands.
- For periodic runs, if the issue is out of scope or missing the required assignee, do not perform any action other than adding `ymuichiro` as assignee when needed.
- If publish intent is ambiguous:
  - If user asks for "公開", "反映", "トップ表示", treat as publish mode.
  - Otherwise create draft-style files without publish metadata.
