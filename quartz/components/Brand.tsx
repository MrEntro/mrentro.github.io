import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface Options {
  /** site name split in two; the second half gets the accent colour */
  name: [string, string]
}

export default ((opts: Options) => {
  const Brand: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => (
    <h2 class={classNames(displayClass, "page-title", "brand")}>
      <a href={pathToRoot(fileData.slug!)}>
        {opts.name[0]}
        <span>{opts.name[1]}</span>
      </a>
    </h2>
  )

  return Brand
}) satisfies QuartzComponentConstructor<Options>
