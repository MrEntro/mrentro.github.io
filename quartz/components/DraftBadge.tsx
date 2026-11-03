import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

/**
 * Marks unpublished notes in Studio previews (`studioPreview: draft`).
 * Styled inline so production CSS stays byte-identical; the field is never published.
 */
export default (() => {
  function DraftBadge({ fileData }: QuartzComponentProps) {
    if (fileData.frontmatter?.studioPreview !== "draft") return null
    return (
      <span
        class="draft-badge"
        style="display:inline-block;margin-bottom:0.75rem;padding:0.1rem 0.5rem;border:1px solid var(--secondary);border-radius:3px;color:var(--secondary);font-family:var(--mono);font-size:0.7rem;letter-spacing:0.12em"
      >
        DRAFT
      </span>
    )
  }

  return DraftBadge
}) satisfies QuartzComponentConstructor
