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
  return (
    <a class="entry teaser-card internal" href={resolveRelative(from, file.slug!)}>
      <div class="e-meta">
        {o.type && (
          <span class={classNames(undefined, "pill", folder)}>{CONTENT_TYPES[folder]}</span>
        )}
        {o.category && category && <span class="e-cat">{category}</span>}
        <span>
          {date && <time datetime={date.toISOString()}>{formatDate(date, cfg.locale)}</time>}
          {o.readingTime && minutes > 0 && ` · ${minutes} min`}
        </span>
      </div>
      <h3>{file.frontmatter?.title}</h3>
      {o.summary && summary && <p>{summary}</p>}
    </a>
  )
}

/** Category cards; only categories that hold a published entry are shown. */
export function CategoryCards({ from, face, allFiles }: Props) {
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
    <div class={classNames(undefined, "cat-cards", `cols-${face.categories.columns}`)}>
      {names.map((name) => {
        const n = count(name)
        const desc = listed.get(name.toLowerCase())?.description
        return (
          <a
            class="cat-card internal"
            href={resolveRelative(from, taxonomySlug("categories", name))}
          >
            <h3>{name}</h3>
            {face.categories.descriptions && desc && <p>{desc}</p>}
            {face.categories.counts && (
              <span class="cat-count">
                {n} {n === 1 ? "entry" : "entries"} →
              </span>
            )}
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
          `layout-${face.look.layout}`,
          `density-${face.look.density}`,
        )}
      >
        {sections.map((s) => {
          if (s.id === "latest") {
            const files = entries.slice(0, face.latest.count)
            return (
              <section class="face-section" id="latest">
                <div class="fs-head">
                  <h2>{s.title}</h2>
                  {entries.length > 0 && (
                    <a class="internal more" href={resolveRelative(from, "timeline" as FullSlug)}>
                      All entries →
                    </a>
                  )}
                </div>
                {files.length === 0 ? (
                  <p class="empty">Nothing here yet.</p>
                ) : (
                  <div class="teasers">
                    {files.map((file) => (
                      <Teaser {...props} file={file} />
                    ))}
                  </div>
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
              <section class="face-section" id="featured">
                <div class="fs-head">
                  <h2>{s.title}</h2>
                </div>
                <div class="teasers featured">
                  {files.map((file) => (
                    <Teaser {...props} file={file} />
                  ))}
                </div>
              </section>
            )
          }
          if (s.id === "categories") {
            return (
              <section class="face-section" id="categories">
                <div class="fs-head">
                  <h2>{s.title}</h2>
                </div>
                <CategoryCards {...props} />
              </section>
            )
          }
          if (s.id === "links" && face.links.length > 0) {
            return (
              <section class="face-section" id="links">
                <div class="fs-head">
                  <h2>{s.title}</h2>
                </div>
                <ul class="face-links">
                  {face.links.map((l) => (
                    <li>
                      <a class="external" href={l.url} rel="noopener noreferrer">
                        {l.label} ↗
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
      <div class={classNames(displayClass, "face-sections", "category-index")}>
        <div class="list-head">
          <h1>Categories</h1>
        </div>
        <CategoryCards from={fileData.slug!} face={face} cfg={cfg} allFiles={allFiles} />
      </div>
    )
  }
  return CategoryIndex
}) satisfies QuartzComponentConstructor
