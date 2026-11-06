import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { NAV_LINKS, navHref } from "./TopNav"

interface Options {
  name: string
  tagline: string
}

/** Site footer: handle | tagline | nav. Only on the live site. */
export default ((opts: Options) => {
  const SiteFooter: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
    if ((cfg.siteMode ?? "live") !== "live") return null
    const slug = fileData.slug!
    return (
      <footer class="site-footer">
        <div class="container grid3">
          <span class="f-left">
            © {new Date().getFullYear()} {opts.name}
          </span>
          <span class="f-mid">
            <span class="hash" aria-hidden="true">
              #
            </span>{" "}
            {opts.tagline}
          </span>
          <nav aria-label="Footer">
            {NAV_LINKS.slice(1).map(([text, target]) => (
              <a href={navHref(slug, target)}>{text}</a>
            ))}
          </nav>
        </div>
      </footer>
    )
  }
  return SiteFooter
}) satisfies QuartzComponentConstructor<Options>
