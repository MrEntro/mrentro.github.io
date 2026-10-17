import readingTime from "reading-time"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { FullSlug, resolveRelative } from "../util/path"
import { formatDate } from "./Date"
import { classNames } from "../util/lang"
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
  | { kind: "stream"; kicker?: string; title?: string; files: QuartzPluginData[] }
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
    return { kind: "stream", kicker: "Category", title: taxonomy.name, files }
  }

  if (slug.endsWith("/index")) {
    const prefix = slug.slice(0, -"index".length)
    const files = entries.filter((f) => f.slug!.startsWith(prefix))
    // top-level type folders are named by the nav; nested folders get a heading
    const title = contentFolder(slug) && prefix.split("/").length === 2 ? undefined : prefix
    return { kind: "stream", kicker: title && "Folder", title, files }
  }
  return undefined
}

function Entry({
  from,
  file,
  cfg,
  allFiles,
}: { from: FullSlug; file: QuartzPluginData } & Pick<QuartzComponentProps, "cfg" | "allFiles">) {
  const folder = contentFolder(file.slug)!
  const date = entryDate(file)
  const minutes = Math.ceil(readingTime(file.text ?? "").minutes)
  const series = frontmatterString(file, "series")
  const summary = summaryOf(file)
  return (
    <a class="entry internal" href={resolveRelative(from, file.slug!)}>
      <div class="e-meta">
        <span class={classNames(undefined, "pill", folder)}>{CONTENT_TYPES[folder]}</span>
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
        <div class={classNames(displayClass, "timeline")}>
          <div class="list-head">
            <h1>Tags</h1>
          </div>
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

    const head = view.title && (
      <div class="list-head">
        {"kicker" in view && view.kicker && <div class="kicker">{view.kicker}</div>}
        {view.kind === "series" && <div class="kicker">Series</div>}
        <h1>{view.title}</h1>
      </div>
    )

    if (view.files.length === 0) {
      return (
        <div class={classNames(displayClass, "timeline")}>
          {head}
          <p class="empty">Nothing here yet.</p>
        </div>
      )
    }

    if (view.kind === "series") {
      return (
        <div class={classNames(displayClass, "timeline")}>
          {head}
          <ol class="entries series-list">
            {view.files.map((file) => (
              <li>
                <Entry from={from} file={file} cfg={cfg} allFiles={allFiles} />
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
      <div class={classNames(displayClass, "timeline")}>
        {head}
        {[...years.entries()].map(([year, files]) => (
          <section class="tl-year">
            <h2 class="yr">{year}</h2>
            <div class="entries">
              {files.map((file) => (
                <Entry from={from} file={file} cfg={cfg} allFiles={allFiles} />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return Timeline
}) satisfies QuartzComponentConstructor
