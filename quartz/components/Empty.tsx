import { QuartzComponent, QuartzComponentConstructor } from "./types"

/** Renders nothing; fills required layout slots such as the footer. */
export default (() => {
  const Empty: QuartzComponent = () => null
  return Empty
}) satisfies QuartzComponentConstructor
