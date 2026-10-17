import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { frontmatterString, isEntry, seriesEntries, taxonomySlug } from "../util/stream"

interface Options {
  /** "top": "Part N of <series>" note above the post; "bottom": prev/next cards after it */
  position: "top" | "bottom"
}

export default ((opts: Options) => {
  const SeriesNav: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const series = frontmatterString(fileData, "series")
    if (!isEntry(fileData) || !series) return null

    const slug = fileData.slug!
    const parts = seriesEntries(allFiles, series)
    const i = parts.findIndex((f) => f.slug === slug)
    const prev = parts[i - 1]
    const next = parts[i + 1]

    if (opts.position === "top") {
      return (
        <div class={classNames(displayClass, "series-note")}>
          Part {i + 1} of{" "}
          <a class="series-name" href={resolveRelative(slug, taxonomySlug("series", series))}>
            {series}
          </a>
          .
          {next && (
            <>
              {" Next: "}
              <a class="internal" href={resolveRelative(slug, next.slug!)}>
                {next.frontmatter?.title}
              </a>
            </>
          )}
        </div>
      )
    }

    return (
      <nav class={classNames(displayClass, "pn")}>
        {prev ? (
          <a class="internal" href={resolveRelative(slug, prev.slug!)}>
            <small>← Previous</small>
            <b>{prev.frontmatter?.title}</b>
          </a>
        ) : (
          <span>
            <small>← Previous</small>Start of series
          </span>
        )}
        {next ? (
          <a class="internal nx" href={resolveRelative(slug, next.slug!)}>
            <small>Next →</small>
            <b>{next.frontmatter?.title}</b>
          </a>
        ) : (
          <span class="nx">
            <small>Next →</small>Coming soon
          </span>
        )}
      </nav>
    )
  }

  return SeriesNav
}) satisfies QuartzComponentConstructor<Options>
