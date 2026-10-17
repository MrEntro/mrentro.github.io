import { QuartzPluginData } from "../plugins/vfile"
import { FullSlug, slugTag } from "./path"

/** Top-level content folders and the label each entry type gets on the site. */
export const CONTENT_TYPES = {
  research: "Research",
  notes: "Note",
  tools: "Tool",
  talks: "Talk",
} as const

export type ContentFolder = keyof typeof CONTENT_TYPES
export type TaxonomyKind = "series" | "categories"

export function contentFolder(slug: string | undefined): ContentFolder | undefined {
  const top = slug?.split("/")[0]
  return top !== undefined && top in CONTENT_TYPES ? (top as ContentFolder) : undefined
}

/** A timeline entry is any page inside a content folder that is not a folder index. */
export function isEntry(file: QuartzPluginData): boolean {
  const slug = file.slug
  return slug !== undefined && contentFolder(slug) !== undefined && !slug.endsWith("/index")
}

export function entryDate(file: QuartzPluginData): Date | undefined {
  return file.dates?.published ?? file.dates?.created
}

export function byDateDesc(a: QuartzPluginData, b: QuartzPluginData): number {
  return (entryDate(b)?.getTime() ?? 0) - (entryDate(a)?.getTime() ?? 0)
}

export function frontmatterString(file: QuartzPluginData, key: string): string | undefined {
  const value = file.frontmatter?.[key]
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined
}

export function summaryOf(file: QuartzPluginData): string | undefined {
  return frontmatterString(file, "summary") ?? file.description
}

export function taxonomySlug(kind: TaxonomyKind, name: string): FullSlug {
  return `${kind}/${slugTag(name.toLowerCase())}/index` as FullSlug
}

/** Entries of a series, ordered by `seriesOrder`. */
export function seriesEntries(allFiles: QuartzPluginData[], series: string): QuartzPluginData[] {
  return allFiles
    .filter((f) => isEntry(f) && frontmatterString(f, "series") === series)
    .sort((a, b) => Number(a.frontmatter?.seriesOrder) - Number(b.frontmatter?.seriesOrder))
}

/** Distinct values of a string frontmatter field across all entries. */
export function taxonomyValues(allFiles: QuartzPluginData[], key: "series" | "category"): string[] {
  const values = allFiles.filter(isEntry).map((f) => frontmatterString(f, key))
  return [...new Set(values.filter((v): v is string => v !== undefined))]
}
