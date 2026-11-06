import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { isEntry } from "../util/stream"

/** Every tag used by a published entry, most used first, with counts. */
export default (() => {
  const TagCloud: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const counts = new Map<string, number>()
    for (const f of allFiles.filter(isEntry)) {
      for (const t of f.frontmatter?.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    if (counts.size === 0) return null

    const tags = [...counts.entries()].sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    return (
      <section class={classNames(displayClass, "tag-cloud")} aria-labelledby="tags-h">
        <h2 class="rail-h" id="tags-h">
          Tags
        </h2>
        <ul class="chips">
          {tags.map(([tag, n]) => (
            <li>
              <a href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>
                {tag}
                <span class="n" aria-label={`${n} ${n === 1 ? "entry" : "entries"}`}>
                  {n}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return TagCloud
}) satisfies QuartzComponentConstructor
