// Theme toggle and the menu drawer (tablet + mobile). Re-bound on every page load ("nav" event).
type Theme = "light" | "dark"

const readSiteTheme = (): Theme =>
  document.documentElement.getAttribute("saved-theme") === "light" ? "light" : "dark"

function applyTheme(theme: Theme, remember: boolean) {
  document.documentElement.setAttribute("saved-theme", theme)
  if (remember) {
    try {
      localStorage.setItem("theme", theme)
    } catch {
      // storage blocked: the choice lasts for this page only
    }
  }
  syncToggles()
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }))
}

function syncToggles() {
  const theme = readSiteTheme()
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
    b.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    )
    b.setAttribute("aria-pressed", theme === "light" ? "true" : "false")
  }
}

// follow the system setting until the visitor picks a theme
window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
  let stored: string | null = null
  try {
    stored = localStorage.getItem("theme")
  } catch {
    stored = null
  }
  if (stored !== "light" && stored !== "dark") applyTheme(e.matches ? "light" : "dark", false)
})

document.addEventListener("nav", () => {
  syncToggles()
  const toggle = () => applyTheme(readSiteTheme() === "dark" ? "light" : "dark", true)
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
    b.addEventListener("click", toggle)
    window.addCleanup(() => b.removeEventListener("click", toggle))
  }

  const opener = document.querySelector<HTMLButtonElement>("[data-drawer-open]")
  const drawer = document.getElementById("site-drawer")
  if (!opener || !drawer) return
  const setOpen = (open: boolean) => {
    document.body.classList.toggle("drawer-open", open)
    opener.setAttribute("aria-expanded", String(open))
    if (open) drawer.querySelector<HTMLElement>("a, button, summary")?.focus()
    else opener.focus()
  }
  const open = () => setOpen(true)
  const close = () => {
    if (document.body.classList.contains("drawer-open")) setOpen(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close()
  }
  opener.addEventListener("click", open)
  document.addEventListener("keydown", onKey)
  const closers = document.querySelectorAll<HTMLElement>("[data-drawer-close]")
  for (const c of closers) c.addEventListener("click", close)
  window.addCleanup(() => {
    opener.removeEventListener("click", open)
    document.removeEventListener("keydown", onKey)
    for (const c of closers) c.removeEventListener("click", close)
    document.body.classList.remove("drawer-open")
  })
})
