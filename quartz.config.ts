import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { Timeline } from "./quartz/components"
import { hiddenPageLayout, teaserPageLayout } from "./quartz.layout"

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

// Colours are design tokens (quartz/styles/mrentro/tokens.scss, accents from Studio Face).
// Quartz's own palette variables are mapped onto the tokens in quartz/styles/mrentro/base.scss;
// these values only seed them and match the tokens.
const palette = {
  dark: {
    light: "#0e0e11",
    lightgray: "#2a2a31",
    gray: "#8a877f",
    darkgray: "#ecebe6",
    dark: "#ecebe6",
    secondary: "#ff8a3d",
    tertiary: "#c08bff",
    highlight: "rgba(255, 122, 26, 0.12)",
    textHighlight: "rgba(168, 85, 247, 0.14)",
  },
  light: {
    light: "#faf9f6",
    lightgray: "#e3e0d8",
    gray: "#6b6862",
    darkgray: "#16151a",
    dark: "#16151a",
    secondary: "#b93f00",
    tertiary: "#7e22ce",
    highlight: "rgba(255, 122, 26, 0.12)",
    textHighlight: "rgba(147, 51, 234, 0.1)",
  },
}

const config: QuartzConfig = {
  configuration: {
    pageTitle: "MrEntro",
    pageTitleSuffix: "",
    siteMode: SITE_MODE,
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
      // self-hosted webfonts (quartz/static/fonts, @font-face in tokens.scss): no third-party requests
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Newsreader",
        body: "Newsreader",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: palette.light,
        darkMode: palette.dark,
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
          light: "github-light",
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
