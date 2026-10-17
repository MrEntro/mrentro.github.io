import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { pathToRoot } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { Timeline } from "../../components"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
import { TaxonomyKind, taxonomySlug, taxonomyValues } from "../../util/stream"

const FRONTMATTER_KEY = { series: "series", categories: "category" } as const

async function processTaxonomyPage(
  ctx: BuildCtx,
  kind: TaxonomyKind,
  name: string,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const slug = taxonomySlug(kind, name)
  const [tree, file] = defaultProcessedContent({
    slug,
    frontmatter: { title: name, tags: [] },
    taxonomy: { kind, name },
  })
  const cfg = ctx.cfg.configuration
  const externalResources = pageResources(pathToRoot(slug), resources)
  const componentData: QuartzComponentProps = {
    ctx,
    fileData: file.data,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles,
  }

  return write({
    ctx,
    content: renderPage(cfg, slug, componentData, opts, externalResources),
    slug,
    ext: ".html",
  })
}

/** Emits `/series/<name>/` and `/categories/<name>/` list pages. */
export const TaxonomyPages: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: Timeline(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  async function* emitAll(ctx: BuildCtx, allFiles: QuartzPluginData[], resources: StaticResources) {
    for (const kind of ["series", "categories"] as const) {
      for (const name of taxonomyValues(allFiles, FRONTMATTER_KEY[kind])) {
        yield processTaxonomyPage(ctx, kind, name, allFiles, opts, resources)
      }
    }
  }

  return {
    name: "TaxonomyPages",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      yield* emitAll(
        ctx,
        content.map((c) => c[1].data),
        resources,
      )
    },
    async *partialEmit(ctx, content, resources) {
      yield* emitAll(
        ctx,
        content.map((c) => c[1].data),
        resources,
      )
    },
  }
}

declare module "vfile" {
  interface DataMap {
    taxonomy: { kind: TaxonomyKind; name: string }
  }
}
