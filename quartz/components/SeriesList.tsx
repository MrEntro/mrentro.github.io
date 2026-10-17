import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { seriesEntries, taxonomySlug, taxonomyValues } from "../util/stream"

/** Sidebar list of every series with its part count. */
export default (() => {
  const SeriesList: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const series = taxonomyValues(allFiles, "series")
    if (series.length === 0) return null
    return (
      <div class={classNames(displayClass, "series-index")}>
        <h3>Series</h3>
        <ul>
          {series.map((name) => {
            const n = seriesEntries(allFiles, name).length
            return (
              <li>
                <a href={resolveRelative(fileData.slug!, taxonomySlug("series", name))}>
                  {name}
                  <small>
                    {n} {n === 1 ? "part" : "parts"}
                  </small>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return SeriesList
}) satisfies QuartzComponentConstructor
