import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { contentFolder } from "../util/stream"

/** Home → Timeline → Categories; type views (/research/ …) stay reachable from entry pills. */
const LINKS: [string, FullSlug][] = [
  ["Home", "index" as FullSlug],
  ["Timeline", "timeline" as FullSlug],
  ["Categories", "categories" as FullSlug],
]

export default (() => {
  const TopNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug!
    const current =
      slug === "index" || slug === "timeline" || slug === "categories"
        ? slug
        : slug.startsWith("categories/")
          ? "categories"
          : contentFolder(slug)
            ? "timeline"
            : ""
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
