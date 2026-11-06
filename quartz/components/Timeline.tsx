import readingTime from "reading-time"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { FullSlug, resolveRelative } from "../util/path"
import { formatDate } from "./Date"
import { classNames } from "../util/lang"
import { loadFace } from "../util/face"
import {
  CONTENT_TYPES,
  byDateDesc,
  contentFolder,
  entryDate,
  frontmatterString,
  isEntry,
  seriesEntries,
  summaryOf,
} from "../util/stream"

type View =
  | {
      kind: "stream"
      kicker?: string
      title?: string
      lede?: string
      filters?: boolean
      files: QuartzPluginData[]
    }
  | { kind: "series"; title: string; files: QuartzPluginData[] }
  | { kind: "tagIndex" }

function hasTag(file: QuartzPluginData, tag: string): boolean {
  return (file.frontmatter?.tags ?? []).some((t) => t === tag || t.startsWith(tag + "/"))
}

/** Works out which slice of the stream a page shows from its slug. */
function viewFor(fileData: QuartzPluginData, allFiles: QuartzPluginData[]): View | undefined {
  const slug = fileData.slug!
  const entries = allFiles.filter(isEntry).sort(byDateDesc)

  if (slug === "index") return { kind: "stream", files: entries }
  if (slug === "timeline")
    return {
      kind: "stream",
      title: "Timeline",
      lede: fileData.description,
      filters: true,
      files: entries,
    }
  if (slug === "tags/index") return { kind: "tagIndex" }
  if (slug.startsWith("tags/")) {
    const tag = slug.slice("tags/".length)
    return {
      kind: "stream",
      kicker: "Tag",
      title: `#${tag}`,
      files: entries.filter((f) => hasTag(f, tag)),
    }
  }

  const taxonomy = fileData.taxonomy
  if (taxonomy?.kind === "series") {
    return { kind: "series", title: taxonomy.name, files: seriesEntries(allFiles, taxonomy.name) }
  }
  if (taxonomy?.kind === "categories") {
    const files = entries.filter((f) => frontmatterString(f, "category") === taxonomy.name)
    const lede = loadFace().categoryList.find(
      (c) => c.name.toLowerCase() === taxonomy.name.toLowerCase(),
    )?.description
    return { kind: "stream", kicker: "Category", title: taxonomy.name, lede, files }
  }

  if (slug.endsWith("/index")) {
    const prefix = slug.slice(0, -"index".length)
    const files = entries.filter((f) => f.slug!.startsWith(prefix))
    // top-level type folders get the type's plural name; nested folders their path
    const folder = contentFolder(slug)
    const top = folder && prefix.split("/").length === 2
    const title = top ? `${CONTENT_TYPES[folder]}${folder === "research" ? "" : "s"}` : prefix
    return { kind: "stream", kicker: top ? "Type" : "Folder", title, filters: !!top, files }
  }
  return undefined
}

function Entry({
  from,
  file,
  cfg,
  allFiles,
  showCategory,
}: { from: FullSlug; file: QuartzPluginData; showCategory: boolean } & Pick<
  QuartzComponentProps,
  "cfg" | "allFiles"
>) {
  const folder = contentFolder(file.slug)!
  const date = entryDate(file)
  const minutes = Math.ceil(readingTime(file.text ?? "").minutes)
  const series = frontmatterString(file, "series")
  const category = frontmatterString(file, "category")
  const summary = summaryOf(file)
  return (
    <a class="entry internal" href={resolveRelative(from, file.slug!)}>
      <div class="e-meta">
        <span class={classNames(undefined, "pill", folder)}>{CONTENT_TYPES[folder]}</span>
        {showCategory && category && <span class="cat">{category}</span>}
        <span>
          {date && <time datetime={date.toISOString()}>{formatDate(date, cfg.locale)}</time>}
          {minutes > 0 && ` · ${minutes} min`}
        </span>
      </div>
      <h3>{file.frontmatter?.title}</h3>
      {summary && <p>{summary}</p>}
      {series && (
        <span class="ser">
          {series} · Part {file.frontmatter?.seriesOrder as number} of{" "}
          {seriesEntries(allFiles, series).length}
        </span>
      )}
    </a>
  )
}

/** Type filters on the timeline: links to the type views, so they work without JS. */
function Filters({ from, allFiles }: { from: FullSlug; allFiles: QuartzPluginData[] }) {
  const entries = allFiles.filter(isEntry)
  const folders = (Object.keys(CONTENT_TYPES) as (keyof typeof CONTENT_TYPES)[]).filter((f) =>
    entries.some((e) => contentFolder(e.slug) === f),
  )
  if (folders.length < 2) return null
  const here = from === "timeline" ? "all" : contentFolder(from)
  const plural = (f: keyof typeof CONTENT_TYPES) =>
    `${CONTENT_TYPES[f]}${f === "research" ? "" : "s"}`
  const items: [string, string, FullSlug, number][] = [
    ["all", "All", "timeline" as FullSlug, entries.length],
    ...folders.map(
      (f) =>
        [
          f,
          plural(f),
          `${f}/index` as FullSlug,
          entries.filter((e) => contentFolder(e.slug) === f).length,
        ] as [string, string, FullSlug, number],
    ),
  ]
  return (
    <nav class="filters" aria-label="Filter by type">
      {items.map(([key, label, target, n]) => (
        <a
          class="internal"
          href={resolveRelative(from, target)}
          aria-current={key === here ? "page" : undefined}
        >
          {label} <span class="n">{n}</span>
        </a>
      ))}
    </nav>
  )
}

export default (() => {
  const Timeline: QuartzComponent = ({
    fileData,
    allFiles,
    cfg,
    displayClass,
  }: QuartzComponentProps) => {
    const view = viewFor(fileData, allFiles)
    if (!view) return null
    const from = fileData.slug!

    if (view.kind === "tagIndex") {
      const counts = new Map<string, number>()
      for (const f of allFiles.filter(isEntry)) {
        for (const t of f.frontmatter?.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
      }
      return (
        <div class={classNames(displayClass, "timeline", "col", "wide")}>
          <header class="page-head">
            <h1 class="page-title">Tags</h1>
          </header>
          <ul class="chips">
            {[...counts.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tag, n]) => (
                <li>
                  <a
                    class="internal tag-link"
                    href={resolveRelative(from, `tags/${tag}` as FullSlug)}
                  >
                    {tag} <small>{n}</small>
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )
    }

    const stream = view.kind === "stream" ? view : undefined
    const head = view.title && (
      <header class="page-head">
        {stream?.kicker && <div class="kicker">{stream.kicker}</div>}
        {view.kind === "series" && <div class="kicker">Series · {view.files.length} parts</div>}
        <h1 class="page-title">{view.title}</h1>
        {stream?.lede && <p class="page-lede">{stream.lede}</p>}
        {stream?.filters && <Filters from={from} allFiles={allFiles} />}
      </header>
    )
    // category pages already say the category
    const showCategory = fileData.taxonomy?.kind !== "categories"

    if (view.files.length === 0) {
      return (
        <div class={classNames(displayClass, "timeline", "col", "wide")}>
          {head}
          <p class="empty">Nothing here yet.</p>
        </div>
      )
    }

    if (view.kind === "series") {
      return (
        <div class={classNames(displayClass, "timeline", "col", "wide")}>
          {head}
          <ol class="entries series-list">
            {view.files.map((file) => (
              <li>
                <Entry
                  from={from}
                  file={file}
                  cfg={cfg}
                  allFiles={allFiles}
                  showCategory={showCategory}
                />
              </li>
            ))}
          </ol>
        </div>
      )
    }

    const years = new Map<string, QuartzPluginData[]>()
    for (const file of view.files) {
      const year = String(entryDate(file)?.getFullYear() ?? "Undated")
      years.set(year, [...(years.get(year) ?? []), file])
    }

    return (
      <div class={classNames(displayClass, "timeline", "col", "wide")}>
        {head}
        {[...years.entries()].map(([year, files]) => (
          <section class="year" aria-labelledby={`y-${year}`}>
            <h2 id={`y-${year}`}>
              {year}{" "}
              <small>
                {files.length} {files.length === 1 ? "entry" : "entries"}
              </small>
            </h2>
            <ul class="entries">
              {files.map((file) => (
                <li>
                  <Entry
                    from={from}
                    file={file}
                    cfg={cfg}
                    allFiles={allFiles}
                    showCategory={showCategory}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  return Timeline
}) satisfies QuartzComponentConstructor
