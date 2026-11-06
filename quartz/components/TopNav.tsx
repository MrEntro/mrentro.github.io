import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { contentFolder } from "../util/stream"

/** Home → Timeline → Categories; type views (/research/ …) stay reachable from entry pills. */
export const NAV_LINKS: [string, FullSlug][] = [
  ["Home", "index" as FullSlug],
  ["Timeline", "timeline" as FullSlug],
  ["Categories", "categories" as FullSlug],
]

/** Which top-level nav item a page belongs to. */
export function currentNav(slug: string): string {
  if (slug === "index" || slug === "timeline" || slug === "categories") return slug
  if (slug.startsWith("categories/")) return "categories"
  if (contentFolder(slug) || slug.startsWith("tags/") || slug.startsWith("series/"))
    return "timeline"
  return ""
}

/**
 * Link from `from` to `target`. The 404 page is served at any path, so its links are
 * absolute from the site root.
 */
export function navHref(from: string, target: FullSlug): string {
  if (from === "404") return target === "index" ? "/" : `/${target}`
  return resolveRelative(from as FullSlug, target)
}

export function NavLinks({ slug, label }: { slug: string; label: string }) {
  const current = currentNav(slug)
  return (
    <nav class="topnav" aria-label={label}>
      {NAV_LINKS.map(([text, target]) => (
        <a
          href={navHref(slug, target)}
          class={target === current ? "cur" : undefined}
          aria-current={target === current ? "page" : undefined}
        >
          {text}
        </a>
      ))}
    </nav>
  )
}

export default (() => {
  const TopNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => (
    <div class={classNames(displayClass, "topnav-wrap")}>
      <NavLinks slug={fileData.slug!} label="Main" />
    </div>
  )
  return TopNav
}) satisfies QuartzComponentConstructor
