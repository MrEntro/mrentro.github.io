import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { BrandLink } from "./Brand"
import { NavLinks } from "./TopNav"
import { ThemeToggleButton } from "./ThemeToggle"

interface Options {
  name: [string, string]
}

/**
 * Sticky site header: brand | centred nav | theme toggle (desktop);
 * menu | brand | toggle (mobile). Only on the live site.
 */
export default ((opts: Options) => {
  const SiteHeader: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
    if ((cfg.siteMode ?? "live") !== "live") return null
    const slug = fileData.slug!
    return (
      <header class="site-header">
        <div class="container grid3">
          <div class="h-left">
            <button
              class="icon-btn h-menu"
              type="button"
              aria-label="Open menu"
              aria-expanded="false"
              aria-controls="site-drawer"
              data-drawer-open
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <BrandLink slug={slug} name={opts.name} extraClass="brand-d" />
          </div>
          <div class="h-center">
            <NavLinks slug={slug} label="Main" />
            <BrandLink slug={slug} name={opts.name} extraClass="brand-m" />
          </div>
          <div class="h-right">
            <ThemeToggleButton />
          </div>
        </div>
      </header>
    )
  }
  return SiteHeader
}) satisfies QuartzComponentConstructor<Options>
