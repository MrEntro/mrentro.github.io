import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { isEntry } from "../util/stream"

/** Every tag used by a published entry, most used first. */
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
      <div class={classNames(displayClass, "tag-cloud")}>
        <h3>Tags</h3>
        <ul class="chips">
          {tags.map(([tag]) => (
            <li>
              <a href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>{tag}</a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return TagCloud
}) satisfies QuartzComponentConstructor
