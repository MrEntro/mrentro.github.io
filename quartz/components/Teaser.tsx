import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { ThemeToggleButton } from "./ThemeToggle"

interface Options {
  /** handle split in two; the second half gets the accent colour */
  name: [string, string]
  tagline: string
  status: string
  /** Hidden site: a big "?" instead of the handle, no status line. */
  hidden?: boolean
}

/** Launch-mode home page: handle, tagline, nothing else (or a "?" when the site is hidden). */
export default ((opts: Options) => {
  const Hidden: QuartzComponent = () => (
    <div class="signal">
      <ThemeToggleButton extraClass="corner" />
      <div class="box">
        <p class="t-prompt">
          <span>~</span> $ ls
        </p>
        <h1 class="t-name t-unknown" aria-label="Nothing here">
          <span class="q">?</span>
          <span class="cursor" aria-hidden="true"></span>
        </h1>
        <p class="t-line">{opts.tagline}</p>
      </div>
    </div>
  )
  if (opts.hidden) return Hidden

  const Teaser: QuartzComponent = () => (
    <div class="signal">
      <ThemeToggleButton extraClass="corner" />
      <div class="box">
        <p class="t-prompt">
          <span>~</span> $ whoami
        </p>
        <h1 class="t-name">
          {opts.name[0]}
          <b>{opts.name[1]}</b>
          <span class="cursor" aria-hidden="true"></span>
        </h1>
        <p class="t-line">{opts.tagline}</p>
        <p class="t-meta">
          status: <i>{opts.status}</i>
        </p>
      </div>
    </div>
  )

  return Teaser
}) satisfies QuartzComponentConstructor<Options>
