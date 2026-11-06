import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { Timeline } from "./quartz/components"
import { teaserPageLayout } from "./quartz.layout"
import { loadFace, withAlpha } from "./quartz/util/face"

/**
 * Launch mode: the build contains only the teaser home page and the 404 page.
 * On unless MRENTRO_LAUNCH_MODE is "false" (Studio previews). Flip the default with the first publication.
 */
const LAUNCH_MODE = (process.env.MRENTRO_LAUNCH_MODE ?? "true") === "true"

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
          Plugin.ContentPage(teaserPageLayout),
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
