import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { ThemeToggleButton } from "../ThemeToggle"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // If baseUrl contains a pathname after the domain, use this as the home link
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  // live site: inside the shell (header, nav, footer)
  if ((cfg.siteMode ?? "live") === "live") {
    return (
      <div class="col wide nf">
        <p class="t-prompt">
          <span>~</span> $ cat /this/page
        </p>
        <h1 class="code404">
          4<span>0</span>4
        </h1>
        <p class="nf-line">This page was never measured. It may have moved, or it never existed.</p>
        <div class="acts">
          <a class="btn primary" href={baseDir}>
            Back home
          </a>
          <a class="btn" href={`${baseDir}timeline`}>
            Browse the timeline
          </a>
        </div>
      </div>
    )
  }

  // teaser / hidden: signal look, nothing to link to but home
  return (
    <div class="signal">
      <ThemeToggleButton extraClass="corner" />
      <div class="box">
        <p class="t-prompt">
          <span>~</span> $ dig this-page
        </p>
        <h1 class="t-name">
          4<b>0</b>4<span class="cursor" aria-hidden="true"></span>
        </h1>
        <p class="t-line">No signal here. Just noise.</p>
        <p class="t-meta">
          <a href={baseDir}>
            $ cd <i>~</i>
          </a>
        </p>
      </div>
    </div>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
