import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { Timeline } from "./quartz/components"
import { hiddenPageLayout, teaserPageLayout } from "./quartz.layout"
import { loadFace, withAlpha } from "./quartz/util/face"

/**
 * Site visibility, switched by MrEntro Studio (Publish → Site visibility):
 * - "live": the full site;
 * - "teaser": only the teaser home page (handle + tagline) and the 404 page;
 * - "hidden": only a "?" home page saying there is nothing to show, and the 404 page.
 * MRENTRO_SITE_MODE overrides it; MRENTRO_LAUNCH_MODE="false" means "live" (Studio previews).
 */
type SiteMode = "live" | "teaser" | "hidden"
const SITE_MODE_DEFAULT: SiteMode = "hidden"
const SITE_MODE: SiteMode = (() => {
  const env = process.env.MRENTRO_SITE_MODE
  if (env === "live" || env === "teaser" || env === "hidden") return env
  if (process.env.MRENTRO_LAUNCH_MODE === "false") return "live"
  return SITE_MODE_DEFAULT
})()
/** Teaser and hidden builds contain only the home page and the 404 page. */
const LAUNCH_MODE = SITE_MODE !== "live"

/** Umami Cloud website ID (public). Analytics are injected in production builds only. */
const UMAMI_WEBSITE_ID = ""
const isProduction = process.env.QUARTZ_ENV === "production"

// Accent colours come from Studio Face (content/face.json), default neon orange + purple.
const { accent, accent2 } = loadFace().look

// dark only: both schemes use the same palette
const palette = {
  light: "#111113",
  lightgray: "#26262b",
  gray: "#7a776f",
  darkgray: "#d6d3cc",
  dark: "#f0eee9",
  secondary: accent,
  tertiary: accent2,
  highlight: withAlpha(accent, 0.08),
  textHighlight: withAlpha(accent2, 0.35),
}

const config: QuartzConfig = {
  configuration: {
    pageTitle: "MrEntro",
    pageTitleSuffix: "",
    enableSPA: !LAUNCH_MODE,
    enablePopovers: !LAUNCH_MODE,
    analytics:
      isProduction && UMAMI_WEBSITE_ID
        ? { provider: "umami", websiteId: UMAMI_WEBSITE_ID, host: "https://cloud.umami.is" }
        : null,
    locale: "en-US",
    baseUrl: "mrentro.com",
    ignorePatterns: ["private", "templates", ".obsidian", "face.json"],
    defaultDateType: "published",
    theme: {
      // system fonts only: no third-party font requests
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Charter",
        body: "Charter",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: palette,
        darkMode: palette,
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-dark",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false, mermaid: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
    ],
    filters: LAUNCH_MODE
      ? [Plugin.LaunchMode()]
      : [Plugin.RemoveDrafts(), Plugin.FrontmatterCheck()],
    emitters: LAUNCH_MODE
      ? [
          Plugin.ComponentResources(),
          Plugin.ContentPage(SITE_MODE === "hidden" ? hiddenPageLayout : teaserPageLayout),
          Plugin.EmptyContentIndex(),
          Plugin.Static(),
          Plugin.Favicon(),
          Plugin.NotFoundPage(),
        ]
      : [
          Plugin.AliasRedirects(),
          Plugin.ComponentResources(),
          Plugin.ContentPage(),
          Plugin.FolderPage({ pageBody: Timeline() }),
          Plugin.TagPage({ pageBody: Timeline() }),
          Plugin.TaxonomyPages(),
          Plugin.ContentIndex({
            enableSiteMap: true,
            enableRSS: false,
          }),
          Plugin.Assets(),
          Plugin.Static(),
          Plugin.Favicon(),
          Plugin.NotFoundPage(),
        ],
  },
}

export default config
