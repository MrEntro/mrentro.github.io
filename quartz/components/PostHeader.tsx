import readingTime from "reading-time"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { formatDate } from "./Date"
import { classNames } from "../util/lang"
import {
  CONTENT_TYPES,
  contentFolder,
  entryDate,
  frontmatterString,
  isEntry,
  summaryOf,
  taxonomySlug,
} from "../util/stream"

/** `updated` from frontmatter, when it is a valid date after the published date. */
function updatedDate(file: QuartzPluginData, published: Date | undefined): Date | undefined {
  const raw = frontmatterString(file, "updated")
  if (!raw) return undefined
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return undefined
  return published && d.getTime() <= published.getTime() ? undefined : d
}
type QuartzPluginData = QuartzComponentProps["fileData"]

/** Kicker (type, category, series), title, dek and byline for a timeline entry. */
export default (() => {
  const PostHeader: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
    if (!isEntry(fileData)) return null

    const slug = fileData.slug!
    const folder = contentFolder(slug)!
    const category = frontmatterString(fileData, "category")
    const series = frontmatterString(fileData, "series")
    const date = entryDate(fileData)
    const updated = updatedDate(fileData, date)
    const minutes = Math.ceil(readingTime(fileData.text ?? "").minutes)
    const summary = summaryOf(fileData)

    return (
      <header class={classNames(displayClass, "post-header")}>
        <div class="kicker">
          <a
            class={classNames(undefined, "pill", folder)}
            href={resolveRelative(slug, `${folder}/index` as never)}
          >
            {CONTENT_TYPES[folder]}
          </a>
          {category && (
            <a href={resolveRelative(slug, taxonomySlug("categories", category))}>{category}</a>
          )}
          {series && (
            <>
              <span class="sep" aria-hidden="true">
                /
              </span>
              <a href={resolveRelative(slug, taxonomySlug("series", series))}>{series}</a>
            </>
          )}
        </div>
        <h1 class="article-title post-title">{fileData.frontmatter?.title}</h1>
        {summary && <p class="dek">{summary}</p>}
        <div class="byline">
          <span class="who">
            <span class="avatar" aria-hidden="true">
              ME
            </span>
            <b>{cfg.pageTitle}</b>
          </span>
          <span class="facts">
            {date && (
              <span>
                <time datetime={date.toISOString()}>{formatDate(date, cfg.locale)}</time>
              </span>
            )}
            {minutes > 0 && <span>{minutes} min read</span>}
            {updated && (
              <span>
                Updated{" "}
                <time datetime={updated.toISOString()}>{formatDate(updated, cfg.locale)}</time>
              </span>
            )}
          </span>
        </div>
      </header>
    )
  }

  return PostHeader
}) satisfies QuartzComponentConstructor
