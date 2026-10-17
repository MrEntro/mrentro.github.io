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

/** Kicker (type + category), title, summary and byline for a timeline entry. */
export default (() => {
  const PostHeader: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
    if (!isEntry(fileData)) return null

    const slug = fileData.slug!
    const folder = contentFolder(slug)!
    const category = frontmatterString(fileData, "category")
    const date = entryDate(fileData)
    const minutes = Math.ceil(readingTime(fileData.text ?? "").minutes)
    const summary = summaryOf(fileData)

    return (
      <div class={classNames(displayClass, "post-header")}>
        <div class="p-kicker">
          <span class={classNames(undefined, "pill", folder)}>{CONTENT_TYPES[folder]}</span>
          {category && (
            <a href={resolveRelative(slug, taxonomySlug("categories", category))}>{category}</a>
          )}
        </div>
        <h1 class="article-title">{fileData.frontmatter?.title}</h1>
        {summary && <p class="p-sum">{summary}</p>}
        <div class="byline">
          <span>
            <b>{cfg.pageTitle}</b>
            {date && (
              <>
                {" · "}
                <time datetime={date.toISOString()}>{formatDate(date, cfg.locale)}</time>
              </>
            )}
          </span>
          {minutes > 0 && <span>{minutes} min read</span>}
        </div>
      </div>
    )
  }

  return PostHeader
}) satisfies QuartzComponentConstructor
