import readingTime from "reading-time"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { FullSlug, resolveRelative } from "../util/path"
import { formatDate } from "./Date"
import { classNames } from "../util/lang"
import { Face, loadFace } from "../util/face"
import {
  CONTENT_TYPES,
  byDateDesc,
  contentFolder,
  entryDate,
  frontmatterString,
  isEntry,
  summaryOf,
  taxonomySlug,
} from "../util/stream"

type Props = Pick<QuartzComponentProps, "cfg" | "allFiles"> & { from: FullSlug; face: Face }

function Teaser({ from, file, face, cfg }: Props & { file: QuartzPluginData }) {
  const folder = contentFolder(file.slug)!
  const date = entryDate(file)
  const minutes = Math.ceil(readingTime(file.text ?? "").minutes)
  const category = frontmatterString(file, "category")
  const summary = summaryOf(file)
  const o = face.latest
  const meta = (
    <div class="e-meta">
      {o.type && <span class={classNames(undefined, "pill", folder)}>{CONTENT_TYPES[folder]}</span>}
      {o.category && category && <span class="cat">{category}</span>}
      <span>
        {date && <time datetime={date.toISOString()}>{formatDate(date, cfg.locale)}</time>}
        {face.look.layout === "list" && o.readingTime && minutes > 0 && ` · ${minutes} min`}
      </span>
    </div>
  )
  if (face.look.layout === "grid") {
    return (
      <a class="card internal" href={resolveRelative(from, file.slug!)}>
        {meta}
        <h3>{file.frontmatter?.title}</h3>
        {o.summary && summary && <p>{summary}</p>}
        <div class="foot">
          <span>{o.readingTime && minutes > 0 ? `${minutes} min read` : ""}</span>
          <span class="go" aria-hidden="true">
            Read →
          </span>
        </div>
      </a>
    )
  }
  return (
    <li>
      <a class="entry internal" href={resolveRelative(from, file.slug!)}>
        {meta}
        <h3>{file.frontmatter?.title}</h3>
        {o.summary && summary && <p>{summary}</p>}
      </a>
    </li>
  )
}

function Teasers({ files, props }: { files: QuartzPluginData[]; props: Props }) {
  const items = files.map((file) => <Teaser {...props} file={file} />)
  return props.face.look.layout === "grid" ? (
    <div class="cards">{items}</div>
  ) : (
    <ul class="entries">{items}</ul>
  )
}

/** Category cards; only categories that hold a published entry are shown. */
export function CategoryCards({
  from,
  face,
  allFiles,
  headingLevel = 3,
}: Props & { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3"
  const entries = allFiles.filter(isEntry)
  const count = (name: string) =>
    entries.filter((f) => frontmatterString(f, "category")?.toLowerCase() === name.toLowerCase())
      .length
  const listed = new Map(face.categoryList.map((c) => [c.name.toLowerCase(), c]))
  // Names from face.json first (Studio order + descriptions), then any other used names.
  const names = [
    ...face.categoryList.map((c) => c.name),
    ...[...new Set(entries.map((f) => frontmatterString(f, "category")))].filter(
      (n): n is string => n !== undefined && !listed.has(n.toLowerCase()),
    ),
  ].filter((n) => count(n) > 0)
  if (names.length === 0) return <p class="empty">Nothing here yet.</p>
  return (
    <div class={classNames(undefined, "cards", "cat-cards", `cols-${face.categories.columns}`)}>
      {names.map((name) => {
        const n = count(name)
        const desc = listed.get(name.toLowerCase())?.description
        return (
          <a
            class="card cat-card internal"
            href={resolveRelative(from, taxonomySlug("categories", name))}
          >
            <H>{name}</H>
            {face.categories.descriptions && desc && <p>{desc}</p>}
            <div class="foot">
              <span>{face.categories.counts ? `${n} ${n === 1 ? "entry" : "entries"}` : ""}</span>
              <span class="go" aria-hidden="true">
                →
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

/** Home page sections after the intro, in the order set in Studio Face. */
export default (() => {
  const FaceSections: QuartzComponent = ({
    fileData,
    allFiles,
    cfg,
    displayClass,
  }: QuartzComponentProps) => {
    const face = loadFace()
    const from = fileData.slug!
    const entries = allFiles.filter(isEntry).sort(byDateDesc)
    const props = { from, face, cfg, allFiles }
    const sections = face.sections.filter((s) => s.enabled)
    return (
      <div
        class={classNames(
          displayClass,
          "face-sections",
          "col",
          "wide",
          `layout-${face.look.layout}`,
          `density-${face.look.density}`,
        )}
      >
        {sections.map((s) => {
          if (s.id === "latest") {
            const files = entries.slice(0, face.latest.count)
            return (
              <section class="face-section" aria-labelledby="fs-latest">
                <div class="section-h">
                  <h2 id="fs-latest">{s.title}</h2>
                  {entries.length > 0 && (
                    <a class="internal" href={resolveRelative(from, "timeline" as FullSlug)}>
                      All entries →
                    </a>
                  )}
                </div>
                {files.length === 0 ? (
                  <p class="empty">Nothing here yet.</p>
                ) : (
                  <Teasers files={files} props={props} />
                )}
              </section>
            )
          }
          if (s.id === "featured") {
            const files = face.featured
              .map((slug) => entries.find((f) => f.slug === slug))
              .filter((f): f is QuartzPluginData => f !== undefined)
            if (files.length === 0) return null
            return (
              <section class="face-section featured" aria-labelledby="fs-featured">
                <div class="section-h">
                  <h2 id="fs-featured">{s.title}</h2>
                </div>
                <Teasers files={files} props={props} />
              </section>
            )
          }
          if (s.id === "categories") {
            return (
              <section class="face-section" aria-labelledby="fs-categories">
                <div class="section-h">
                  <h2 id="fs-categories">{s.title}</h2>
                  <a class="internal" href={resolveRelative(from, "categories" as FullSlug)}>
                    All categories →
                  </a>
                </div>
                <CategoryCards {...props} />
              </section>
            )
          }
          if (s.id === "links" && face.links.length > 0) {
            return (
              <section class="face-section" aria-labelledby="fs-links">
                <div class="section-h">
                  <h2 id="fs-links">{s.title}</h2>
                </div>
                <ul class="face-links">
                  {face.links.map((l) => (
                    <li>
                      <a class="external" href={l.url} rel="noopener noreferrer">
                        {l.label} <span aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )
          }
          return null
        })}
        {face.footer && <p class="face-footer">{face.footer}</p>}
      </div>
    )
  }
  return FaceSections
}) satisfies QuartzComponentConstructor

/** `/categories/`: every category with published entries. */
export const CategoryIndex = (() => {
  const CategoryIndex: QuartzComponent = ({ fileData, allFiles, cfg, displayClass }) => {
    const face = loadFace()
    return (
      <div class={classNames(displayClass, "col", "wide", "category-index")}>
        <header class="page-head">
          <h1 class="page-title">Categories</h1>
          {fileData.description && <p class="page-lede">{fileData.description}</p>}
        </header>
        <CategoryCards
          from={fileData.slug!}
          face={face}
          cfg={cfg}
          allFiles={allFiles}
          headingLevel={2}
        />
      </div>
    )
  }
  return CategoryIndex
}) satisfies QuartzComponentConstructor
