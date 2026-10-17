import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface Options {
  /** handle split in two; the second half gets the accent colour */
  name: [string, string]
  tagline: string
  status: string
}

/** Launch-mode home page: handle, tagline, nothing else. */
export default ((opts: Options) => {
  const Teaser: QuartzComponent = () => (
    <main class="signal">
      <div class="box">
        <div class="t-prompt">
          <span>~</span> $ whoami
        </div>
        <h1 class="t-name">
          {opts.name[0]}
          <b>{opts.name[1]}</b>
          <span class="cursor" aria-hidden="true"></span>
        </h1>
        <p class="t-line">{opts.tagline}</p>
        <div class="t-meta">
          status: <i>{opts.status}</i>
        </div>
      </div>
    </main>
  )

  return Teaser
}) satisfies QuartzComponentConstructor<Options>
