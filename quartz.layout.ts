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
const isSlug = (slug: string) => (page: QuartzComponentProps) => page.fileData.slug === slug

// components shared across all pages
// header and footer render only on the live site (cfg.siteMode)
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.SiteHeader({ name: NAME })],
  afterBody: [],
  footer: Component.SiteFooter({ name: NAME.join(""), tagline: TAGLINE }),
}

// left rail; below 1200 px it is the menu drawer (DrawerHead shows only there)
const left = [Component.DrawerHead({ name: NAME }), Component.SiteExplorer(), Component.TagCloud()]

// components for pages that display a single page (e.g. a single note)
// the home page (content/index.md) is the Studio Face: hero, intro text, then the
// sections set in the Studio (latest, featured, categories, links); the full
// stream lives on /timeline/ and the category list on /categories/
export const defaultContentPageLayout: PageLayout & Pick<FullPageLayout, "afterBody"> = {
  beforeBody: [
    Component.DraftBadge(),
    Component.ConditionalRender({ component: Component.FaceHero(), condition: isHome }),
    Component.PostHeader(),
    Component.SeriesNav({ position: "top" }),
  ],
  afterBody: [
    Component.ConditionalRender({
      component: Component.TagList(),
      condition: (p) => !isHome(p) && !isSlug("timeline")(p) && !isSlug("categories")(p),
    }),
    Component.SeriesNav({ position: "bottom" }),
    Component.ConditionalRender({ component: Component.FaceSections(), condition: isHome }),
    Component.ConditionalRender({ component: Component.Timeline(), condition: isSlug("timeline") }),
    Component.ConditionalRender({
      component: Component.CategoryIndex(),
      condition: isSlug("categories"),
    }),
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
  beforeBody: [],
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

// hidden site: a "?" home page with nothing to show (Studio → Site visibility)
export const hiddenPageLayout: Partial<FullPageLayout> = {
  ...teaserPageLayout,
  pageBody: Component.Teaser({
    name: ["", ""],
    tagline: "Nothing to show here right now.",
    status: "",
    hidden: true,
  }),
}
