import { QuartzFilterPlugin } from "../types"
import { isEntry } from "../../util/stream"

/**
 * Fails the build when a timeline entry breaks the content model:
 * `date` is required, `category` is a single string, `series` needs a numeric `seriesOrder`.
 */
export const FrontmatterCheck: QuartzFilterPlugin<{}> = () => ({
  name: "FrontmatterCheck",
  shouldPublish(_ctx, [_tree, vfile]) {
    if (!isEntry(vfile.data)) return true

    const fm = vfile.data.frontmatter ?? { title: "" }
    const errors: string[] = []
    if (fm.date === undefined || fm.date === null || fm.date === "") {
      errors.push("`date` is required")
    }
    if (fm.category !== undefined && typeof fm.category !== "string") {
      errors.push("`category` must be a single string")
    }
    if (fm.series !== undefined) {
      if (typeof fm.series !== "string") errors.push("`series` must be a string")
      if (typeof fm.seriesOrder !== "number") {
        errors.push("`seriesOrder` (number) is required when `series` is set")
      }
    }

    if (errors.length > 0) {
      throw new Error(`Invalid frontmatter in ${vfile.data.relativePath}: ${errors.join("; ")}`)
    }
    return true
  },
})
