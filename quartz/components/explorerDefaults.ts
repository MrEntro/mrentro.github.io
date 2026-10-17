import { FileTrieNode } from "../util/fileTrie"

// Shared by the server component and the browser script, so the defaults never
// need to be serialized and revived with `new Function` (blocked by the CSP).

export const defaultMapFn = (node: FileTrieNode) => {
  return node
}

export const defaultSortFn = (a: FileTrieNode, b: FileTrieNode) => {
  // Sort order: folders first, then files. Sort folders and files alphabeticall
  if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
    // numeric: true: Whether numeric collation should be used, such that "1" < "2" < "10"
    // sensitivity: "base": Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  }

  if (!a.isFolder && b.isFolder) {
    return 1
  } else {
    return -1
  }
}

export const defaultFilterFn = (node: FileTrieNode) => node.slugSegment !== "tags"
