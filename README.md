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

The build fails on entries that break these rules.

## Launch mode

`LAUNCH_MODE` in `quartz.config.ts`. When `true`, the build only emits the teaser home page and the 404 page.

## Changes to upstream Quartz

Custom files: `quartz/components/{Timeline,TopNav,PostHeader,SeriesNav,SeriesList,TagCloud,Brand,Teaser,Empty}.tsx`, `quartz/plugins/filters/{launchMode,frontmatterCheck}.ts`, `quartz/plugins/emitters/{taxonomyPage.tsx,emptyContentIndex.ts}`, `quartz/util/stream.ts`, `quartz/styles/custom.scss`.

Edited upstream files: `quartz/components/pages/404.tsx` (signal-style 404), `quartz/components/scripts/graph.inline.ts` (nodes coloured by type), `quartz/components/Head.tsx` (removed cdnjs preconnect).
