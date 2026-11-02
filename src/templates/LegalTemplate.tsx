import { DateText } from '@/components/content/DateText'
import { RichTextView } from '@/components/content/RichTextView'
import type { Page } from '@/payload-types'

import { TemplateFrame } from './TemplateFrame'

/** תקנון ומדיניות ביטול, מדיניות פרטיות, הצהרת נגישות: rich-text body and "last updated". */
export function LegalTemplate({ page }: { page: Page }) {
  return (
    <TemplateFrame page={page} template="legal">
      {page.lastUpdated ? (
        <p>
          <DateText value={page.lastUpdated} />
        </p>
      ) : null}
      <RichTextView data={page.body} />
    </TemplateFrame>
  )
}
