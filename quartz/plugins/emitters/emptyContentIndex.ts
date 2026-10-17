import { QuartzEmitterPlugin } from "../types"
import { FullSlug } from "../../util/path"
import { write } from "./helpers"

/**
 * Launch mode: page scripts fetch the content index eagerly, so serve an empty one
 * instead of a real index that would expose unpublished text.
 */
export const EmptyContentIndex: QuartzEmitterPlugin = () => ({
  name: "EmptyContentIndex",
  async emit(ctx) {
    return [
      await write({ ctx, slug: "static/contentIndex" as FullSlug, ext: ".json", content: "{}" }),
    ]
  },
  async *partialEmit() {},
})
