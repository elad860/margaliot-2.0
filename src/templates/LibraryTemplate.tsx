import Link from 'next/link'

import { DateText } from '@/components/content/DateText'
import { getLessons, getParashot } from '@/lib/cms'
import { childPath } from '@/lib/cms/paths'
import type { Page } from '@/payload-types'

import { TemplateFrame } from './TemplateFrame'

/** פרשת השבוע (parashot, newest first) and שיעורי התחזקות אונליין (lessons). */
export async function LibraryTemplate({ page, kind }: { page: Page; kind: 'parashot' | 'lessons' }) {
  const items =
    kind === 'parashot'
      ? (await getParashot()).map((p) => ({
          id: p.id,
          label: p.name,
          href: childPath('parashot', p.slug),
          date: p.publishDate,
        }))
      : (await getLessons()).map((l) => ({
          id: l.id,
          label: l.title,
          href: childPath('lessons', l.slug),
          date: l.liveStart,
        }))
  return (
    <TemplateFrame page={page} template="library">
      {items.length > 0 ? (
        <ul data-region="library">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href}>{item.label}</Link>
              {item.date ? (
                <>
                  {' '}
                  <DateText value={item.date} />
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </TemplateFrame>
  )
}
