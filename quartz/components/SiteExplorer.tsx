import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import { CONTENT_TYPES, ContentFolder, byDateDesc, contentFolder, isEntry } from "../util/stream"
import { BrandLink } from "./Brand"
import { NavLinks } from "./TopNav"

const PLURAL: Record<ContentFolder, string> = {
  research: "Research",
  notes: "Notes",
  tools: "Tools",
  talks: "Talks",
}
/** Below this many entries in total every type folder starts open. */
const OPEN_ALL_BELOW = 12

/**
 * Explorer: published entries grouped by type, newest first, rendered at build time
 * (no client script). The current page's folder is open and its entry marked.
 */
export default (() => {
  const SiteExplorer: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const slug = fileData.slug!
    const entries = allFiles.filter(isEntry).sort(byDateDesc)
    const groups = (Object.keys(CONTENT_TYPES) as ContentFolder[])
      .map((folder) => ({ folder, files: entries.filter((f) => contentFolder(f.slug) === folder) }))
      .filter((g) => g.files.length > 0)
    if (groups.length === 0) return null
    const here = contentFolder(slug)
    return (
      <section class={classNames(displayClass, "site-explorer")} aria-labelledby="explorer-h">
        <h2 class="rail-h" id="explorer-h">
          Explorer
        </h2>
        <ul class="tree">
          {groups.map(({ folder, files }) => (
            <li>
              <details open={entries.length < OPEN_ALL_BELOW || folder === here}>
                <summary>
                  <svg
                    class="chev"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    aria-hidden="true"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                  <i class={classNames(undefined, "dot", folder)} aria-hidden="true"></i>
                  {PLURAL[folder]}
                  <span class="count">{files.length}</span>
                </summary>
                <ul>
                  {files.map((f) => (
                    <li>
                      <a
                        href={resolveRelative(slug, f.slug as FullSlug)}
                        class={f.slug === slug ? "cur" : undefined}
                        aria-current={f.slug === slug ? "page" : undefined}
                      >
                        {f.frontmatter?.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </section>
    )
  }
  return SiteExplorer
}) satisfies QuartzComponentConstructor

interface DrawerOptions {
  name: [string, string]
}

/** Top of the left rail when it is the menu drawer (below 1200 px): brand, close, nav. */
export const DrawerHead = ((opts: DrawerOptions) => {
  const DrawerHead: QuartzComponent = ({ fileData }: QuartzComponentProps) => (
    <div class="drawer-head">
      <div class="d-top">
        <BrandLink slug={fileData.slug!} name={opts.name} />
        <button class="icon-btn" type="button" aria-label="Close menu" data-drawer-close>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div class="d-nav">
        <NavLinks slug={fileData.slug!} label="Menu" />
      </div>
    </div>
  )
  return DrawerHead
}) satisfies QuartzComponentConstructor<DrawerOptions>
