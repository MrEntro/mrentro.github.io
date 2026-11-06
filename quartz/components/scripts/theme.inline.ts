// Runs in <head> (prescript.js, an external file: the CSP allows no inline JS) before first paint:
// the visitor's stored choice wins, otherwise the system setting.
const storedTheme = (() => {
  try {
    return localStorage.getItem("theme")
  } catch {
    return null
  }
})()
const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
document.documentElement.setAttribute(
  "saved-theme",
  storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemTheme,
)
