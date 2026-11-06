import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { loadFace } from "../util/face"

/** Home page hero (Studio Face): prompt line, handle, tagline, status. */
export default (() => {
  const FaceHero: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const { hero, look } = loadFace()
    return (
      <header
        class={classNames(
          displayClass,
          "face-hero",
          `hero-${look.heroSize}`,
          `align-${hero.align}`,
          look.grid ? "hero-grid" : "",
        )}
      >
        {hero.kicker && (
          <div class="t-prompt">
            <span>{hero.kicker.split(" ")[0]}</span> {hero.kicker.split(" ").slice(1).join(" ")}
          </div>
        )}
        <h1 class="t-name">
          {hero.name[0]}
          <b>{hero.name[1]}</b>
          {hero.cursor && <span class="cursor" aria-hidden="true"></span>}
        </h1>
        {hero.tagline && <p class="t-line">{hero.tagline}</p>}
        {hero.status && (
          <div class="t-meta">
            status: <i>{hero.status}</i>
          </div>
        )}
      </header>
    )
  }
  return FaceHero
}) satisfies QuartzComponentConstructor
