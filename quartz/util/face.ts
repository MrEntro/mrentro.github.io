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

// ---------- accent colours from Studio Face → design tokens ----------

type RGB = [number, number, number]
const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const hexOf = ([r, g, b]: RGB) =>
  "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
const luminance = ([r, g, b]: RGB) => {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
/** WCAG contrast ratio of two `#rrggbb` colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
/** Mix `hex` toward white or black until it reaches `min` contrast on `bg`. */
function shadeFor(hex: string, toward: "white" | "black", bg: string, min: number): string {
  const from = rgb(hex)
  const to: RGB = toward === "white" ? [255, 255, 255] : [0, 0, 0]
  for (let t = 0; t <= 1; t += 0.02) {
    const c = hexOf(from.map((v, i) => v + (to[i] - v) * t) as RGB)
    if (contrast(c, bg) >= min) return c
  }
  return toward === "white" ? "#ffffff" : "#000000"
}

// worst-case text backgrounds per theme (--raised), from tokens.scss
const DARK_TEXT_BG = "#1c1c22"
const LIGHT_TEXT_BG = "#f2f0eb"

/**
 * Token overrides when Studio Face sets non-default accents: fills keep the chosen colour,
 * text variants are shaded per theme until they pass AA (4.5:1) on every surface.
 * Empty for the default accents (tokens.scss already holds the tuned values).
 */
export function faceAccentCss(face: Face): string {
  const { accent, accent2 } = face.look
  if (accent === DEFAULT_FACE.look.accent && accent2 === DEFAULT_FACE.look.accent2) return ""
  const onAccent =
    contrast(accent, "#140a02") >= contrast(accent, "#ffffff") ? "#140a02" : "#ffffff"
  const common = `--accent: ${accent}; --on-accent: ${onAccent}; --accent-soft: ${withAlpha(accent, 0.12)};`
  const dark = `${common} --accent-text: ${shadeFor(accent, "white", DARK_TEXT_BG, 4.5)}; --accent-2: ${accent2}; --accent-2-text: ${shadeFor(accent2, "white", DARK_TEXT_BG, 4.5)}; --accent-2-soft: ${withAlpha(accent2, 0.14)}; --focus: var(--accent-2-text); --selection: ${withAlpha(accent, 0.35)};`
  const light = `${common} --accent-text: ${shadeFor(accent, "black", LIGHT_TEXT_BG, 4.5)}; --accent-2: ${shadeFor(accent2, "black", LIGHT_TEXT_BG, 3)}; --accent-2-text: ${shadeFor(accent2, "black", LIGHT_TEXT_BG, 4.5)}; --accent-2-soft: ${withAlpha(accent2, 0.1)}; --focus: var(--accent-2-text); --selection: ${withAlpha(accent, 0.25)};`
  return [
    `html:root, html:root[saved-theme="dark"] { ${dark} }`,
    `html:root[saved-theme="light"] { ${light} }`,
    `@media (prefers-color-scheme: light) { html:root:not([saved-theme]) { ${light} } }`,
  ].join("\n")
}
