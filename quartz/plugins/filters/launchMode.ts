import { QuartzFilterPlugin } from "../types"

/** Launch mode: publish nothing but the home page, which renders as the teaser. */
export const LaunchMode: QuartzFilterPlugin<{}> = () => ({
  name: "LaunchMode",
  shouldPublish(_ctx, [_tree, vfile]) {
    return vfile.data.slug === "index"
  },
})
