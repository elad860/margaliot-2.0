import type { Page } from '@/payload-types'

import { TemplateFrame } from './TemplateFrame'

/** מי אנחנו, פגישת ייעוץ, יצירת קשר. */
export function InformationTemplate({ page }: { page: Page }) {
  return <TemplateFrame page={page} template="information" />
}
