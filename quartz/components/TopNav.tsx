import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { CONTENT_TYPES, ContentFolder, contentFolder } from "../util/stream"

const LINKS: [string, FullSlug][] = [
  ["All", "index" as FullSlug],
  ...(Object.keys(CONTENT_TYPES) as ContentFolder[]).map((folder): [string, FullSlug] => [
    folder[0].toUpperCase() + folder.slice(1),
    `${folder}/index` as FullSlug,
  ]),
]

export default (() => {
  const TopNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug!
    const current = slug === "index" ? "index" : `${contentFolder(slug)}/index`
    return (
      <nav class={classNames(displayClass, "topnav")}>
        {LINKS.map(([label, target]) => (
          <a href={resolveRelative(slug, target)} class={target === current ? "cur" : undefined}>
            {label}
          </a>
        ))}
      </nav>
    )
  }

  return TopNav
}) satisfies QuartzComponentConstructor
