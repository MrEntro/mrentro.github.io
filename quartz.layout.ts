import { FullPageLayout, PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { QuartzComponentProps } from "./quartz/components/types"

const NAME: [string, string] = ["Mr", "Entro"]
const TAGLINE = "Order is just disorder you haven't measured yet."

const graphOptions = {
  localGraph: { showTags: false },
  globalGraph: { showTags: false },
}
const isHome = (page: QuartzComponentProps) => page.fileData.slug === "index"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Empty(),
}

const left = [
  Component.Brand({ name: NAME }),
  Component.MobileOnly(Component.Spacer()),
  Component.Explorer({ title: "Explorer" }),
  Component.DesktopOnly(Component.TagCloud()),
]

// components for pages that display a single page (e.g. a single note)
// the home page (content/index.md) renders its intro text followed by the timeline
export const defaultContentPageLayout: PageLayout & Pick<FullPageLayout, "afterBody"> = {
  beforeBody: [
    Component.TopNav(),
    Component.PostHeader(),
    Component.SeriesNav({ position: "top" }),
  ],
  afterBody: [
    Component.SeriesNav({ position: "bottom" }),
    Component.ConditionalRender({ component: Component.TagList(), condition: (p) => !isHome(p) }),
    Component.ConditionalRender({ component: Component.Timeline(), condition: isHome }),
  ],
  left,
  right: [
    Component.ConditionalRender({
      component: Component.Graph({ ...graphOptions, localGraph: { showTags: false, depth: -1 } }),
      condition: isHome,
    }),
    Component.ConditionalRender({
      component: Component.Graph(graphOptions),
      condition: (p) => !isHome(p),
    }),
    Component.ConditionalRender({ component: Component.SeriesList(), condition: isHome }),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages (type folders, tags, series, categories)
export const defaultListPageLayout: PageLayout & Pick<FullPageLayout, "afterBody"> = {
  beforeBody: [Component.TopNav()],
  afterBody: [],
  left,
  right: [Component.Graph({ ...graphOptions, localGraph: { showTags: false, depth: -1 } })],
}

// launch mode: the home page is the teaser and nothing else
export const teaserPageLayout: Partial<FullPageLayout> = {
  header: [],
  beforeBody: [],
  afterBody: [],
  left: [],
  right: [],
  pageBody: Component.Teaser({ name: NAME, tagline: TAGLINE, status: "measuring" }),
  footer: Component.Empty(),
}
