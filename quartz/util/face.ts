import { readFileSync } from "fs"
import path from "path"

/**
 * Homepage settings written by MrEntro Studio ("Studio Face") into
 * `content/face.json`. Only public data: featured notes as site slugs and
 * the categories that already hold a published note. Missing file or fields
 * fall back to the defaults below.
 */
export type FaceSectionId = "latest" | "featured" | "categories" | "links"

export interface Face {
  hero: {
    kicker: string
    name: [string, string]
    tagline: string
    status: string
    cursor: boolean
    align: "left" | "center"
  }
  sections: { id: FaceSectionId; enabled: boolean; title: string }[]
  latest: {
    count: number
    summary: boolean
    readingTime: boolean
    type: boolean
    category: boolean
  }
  featured: string[]
  categories: { descriptions: boolean; counts: boolean; columns: 1 | 2 | 3 }
  links: { label: string; url: string }[]
  look: {
    accent: string
    accent2: string
    layout: "list" | "grid"
    density: "comfortable" | "compact"
    heroSize: "small" | "medium" | "large"
    grid: boolean
  }
  footer: string
  categoryList: { name: string; description: string }[]
}

export const DEFAULT_FACE: Face = {
  hero: {
    kicker: "~ $ whoami",
    name: ["Mr", "Entro"],
    tagline: "Order is just disorder you haven't measured yet.",
    status: "measuring",
    cursor: true,
    align: "left",
  },
  sections: [
    { id: "latest", enabled: true, title: "Latest" },
    { id: "featured", enabled: false, title: "Featured" },
    { id: "categories", enabled: true, title: "Categories" },
    { id: "links", enabled: false, title: "Elsewhere" },
  ],
  latest: { count: 5, summary: true, readingTime: true, type: true, category: true },
  featured: [],
  categories: { descriptions: true, counts: true, columns: 2 },
  links: [],
  look: {
    accent: "#ff7a1a",
    accent2: "#a855f7",
    layout: "list",
    density: "comfortable",
    heroSize: "medium",
    grid: true,
  },
  footer: "",
  categoryList: [],
}

const HEX = /^#[0-9a-fA-F]{6}$/

let cached: { file: string; face: Face } | undefined

/** Read `<contentDir>/face.json` (once per build), merged over the defaults. */
export function loadFace(contentDir = "content"): Face {
  const file = path.resolve(contentDir, "face.json")
  if (cached?.file === file) return cached.face
  let raw: Partial<Face> = {}
  try {
    raw = JSON.parse(readFileSync(file, "utf8")) as Partial<Face>
  } catch {
    raw = {}
  }
  const d = DEFAULT_FACE
  const face: Face = {
    ...d,
    ...raw,
    hero: { ...d.hero, ...raw.hero },
    latest: { ...d.latest, ...raw.latest },
    categories: { ...d.categories, ...raw.categories },
    look: { ...d.look, ...raw.look },
    sections: Array.isArray(raw.sections) ? raw.sections : d.sections,
    featured: Array.isArray(raw.featured) ? raw.featured : [],
    links: Array.isArray(raw.links)
      ? raw.links.filter((l) => /^(https:\/\/|mailto:)/.test(String(l.url)))
      : [],
    categoryList: Array.isArray(raw.categoryList) ? raw.categoryList : [],
  }
  if (!HEX.test(face.look.accent)) face.look.accent = d.look.accent
  if (!HEX.test(face.look.accent2)) face.look.accent2 = d.look.accent2
  cached = { file, face }
  return face
}

/** `#rrggbb` + alpha → `rgba(...)` (theme highlight colours). */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
