# mrentro.github.io

Source for [mrentro.com](https://mrentro.com), built with [Quartz](https://github.com/jackyzha0/quartz) v4.5.2 (MIT, see `LICENSE.txt`).

## Local

```sh
npm ci
npx quartz build --serve   # http://localhost:8080
```

Node version is pinned in `.node-version`. Analytics are only injected when `QUARTZ_ENV=production` (set in CI).

## Content

Obsidian-flavoured Markdown under `content/`. The folder sets the type: `research/`, `notes/`, `tools/`, `talks/`.

```yaml
title: string # optional, defaults to filename
date: date # required
updated: date # optional
category: string # optional, at most one
tags: [string] # optional
series: string # optional
seriesOrder: number # required if series is set
summary: string # optional, falls back to first paragraph
```

The build fails on entries that break these rules. `summary` is also the page's meta description.

## Home page (Studio Face)

`content/face.json` (written by MrEntro Studio, "Studio Face") drives the home page and the accent colours: hero, intro (`content/index.md`), sections (latest teasers, featured, categories, links), layout. It holds public data only: featured entries as slugs, and only categories that have a published entry. Missing file = defaults. The full stream is at `/timeline/` (`content/timeline.md`), the category list at `/categories/` (`content/categories.md`).

## Site visibility (launch mode)

`SITE_MODE_DEFAULT` in `quartz.config.ts`, switched by MrEntro Studio (Publish → Site visibility) through a PR:

- `"live"`: the full site.
- `"teaser"`: only the teaser home page (handle + tagline) and the 404 page.
- `"hidden"`: only a "?" home page ("Nothing to show here right now.") and the 404 page.

`MRENTRO_SITE_MODE` overrides it; `MRENTRO_LAUNCH_MODE="false"` means `"live"` (MrEntro Studio previews).

`studioPreview: draft` in frontmatter shows a DRAFT badge on the page (`DraftBadge`). Studio sets it on preview copies only; it is never published.

## Hosting

GitHub Pages is primary; Cloudflare Pages, a VPS and shared hosting (SSH/rsync) are prepared and
off until configured. One build, per-host files from `deploy/headers.mjs`: see
[docs/HOSTING.md](docs/HOSTING.md).

## Container (VPS)

```sh
docker compose up -d --build        # http://127.0.0.1:8080
deploy/smoke-test.sh                # routes, status codes, security headers
```

Two-stage `Dockerfile`: Node builds the site, unprivileged nginx serves `public/` on port 8080. `deploy/csp.mjs` generates a strict CSP at build time (inline scripts and syntax-highlighting style attributes allowed by hash; no `unsafe-inline`/`unsafe-eval`). `compose.yaml` runs it read-only with all capabilities dropped; the Caddy service for TLS is commented out until the VPS exists. CI builds and smoke-tests the image on every push and PR.

## Design system (M16)

Tokens in `quartz/styles/mrentro/tokens.scss` (same names as MrEntro Studio's `web/src/tokens.css`), then `base`, `layout`, `components` and `pages` next to it; `custom.scss` only loads them. Fonts are self-hosted in `quartz/static/fonts/` (Inter, Newsreader, JetBrains Mono; OFL, versions in its README); no third-party requests, so the CSP keeps `font-src 'self'`.

- Dark by default, light theme; the system setting decides until the visitor uses the toggle (stored in `localStorage`). The theme is set before first paint by `quartz/components/scripts/theme.inline.ts` (part of the external `prescript.js`, no inline JS); toggle and menu drawer in `scripts/site.inline.ts`.
- Studio Face accents other than the defaults become token overrides with per-theme text shades that keep AA contrast (`faceAccentCss` in `quartz/util/face.ts`).
- Layout: header, three columns with equal rails (explorer | content | graph + backlinks), footer. Below 1200 px the left rail is the menu drawer and the right rail follows the content; below 768 px the header is menu | brand | theme.
- Header, nav and footer render only when `siteMode` is `"live"`; teaser, hidden and their 404 keep the Signal look.

## Changes to upstream Quartz

Custom files: `quartz/components/{Timeline,TopNav,PostHeader,SeriesNav,SeriesList,TagCloud,Brand,Teaser,Empty,DraftBadge,FaceHero,FaceSections,SiteHeader,SiteFooter,SiteExplorer,ThemeToggle}.tsx`, `quartz/components/scripts/{theme,site}.inline.ts`, `quartz/plugins/filters/{launchMode,frontmatterCheck}.ts`, `quartz/plugins/emitters/{taxonomyPage.tsx,emptyContentIndex.ts}`, `quartz/util/{stream,face}.ts`, `quartz/styles/custom.scss`, `quartz/styles/mrentro/*.scss`.

Edited upstream files:

- `quartz/cfg.ts`: `siteMode` in the global configuration
- `quartz/components/renderPage.tsx`: page shell (skip link, header outside the grid, `main` and `aside` landmarks, footer, drawer scrim)
- `quartz/components/Head.tsx`: also theme scripts, font preloads, Face accent tokens

- `quartz/components/pages/404.tsx`: 404 inside the site shell when live, signal-style otherwise
- `quartz/components/scripts/graph.inline.ts`: nodes coloured by type; `pixi.js/unsafe-eval` import so the graph runs without `unsafe-eval`
- `quartz/components/Head.tsx`: removed cdnjs preconnect
- `quartz/plugins/transformers/description.ts`: falls back to frontmatter `summary`
- `quartz/components/Explorer.tsx`, `quartz/components/scripts/explorer.inline.ts` (+ new `explorerDefaults.ts`): default sort/filter/map functions are shared code instead of strings revived with `new Function`
- `quartz/components/scripts/spa.inline.ts`: route announcer styled via CSSOM instead of a `style` attribute
