import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface Options {
  /** site name split in two; the second half gets the accent colour */
  name: [string, string]
}

export function BrandLink({
  slug,
  name,
  extraClass,
}: {
  slug: string
  name: [string, string]
  extraClass?: string
}) {
  return (
    <a
      class={classNames(undefined, "brand", extraClass ?? "")}
      href={slug === "404" ? "/" : pathToRoot(slug as never)}
    >
      {name[0]}
      <b>{name[1]}</b>
    </a>
  )
}

export default ((opts: Options) => {
  const Brand: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => (
    <div class={classNames(displayClass, "brand-wrap")}>
      <BrandLink slug={fileData.slug!} name={opts.name} />
    </div>
  )
  return Brand
}) satisfies QuartzComponentConstructor<Options>
