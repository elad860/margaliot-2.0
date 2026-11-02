import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Renders Lexical rich text, or nothing when empty. */
export function RichTextView({ data }: { data: unknown }) {
  const state = data as SerializedEditorState | null | undefined
  if (!state?.root?.children?.length) return null
  return <RichText data={state} />
}
