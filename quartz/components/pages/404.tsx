import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // If baseUrl contains a pathname after the domain, use this as the home link
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <main class="signal">
      <div class="box">
        <div class="t-prompt">
          <span>~</span> $ dig this-page
        </div>
        <h1 class="t-name">
          4<b>0</b>4<span class="cursor" aria-hidden="true"></span>
        </h1>
        <p class="t-line">No signal here. Just noise.</p>
        <div class="t-meta">
          <a href={baseDir}>
            $ cd <i>~</i>
          </a>
        </div>
      </div>
    </main>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
