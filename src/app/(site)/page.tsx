import { SystemPageView } from '@/templates/SystemPageView'
import { systemPageMetadata } from '@/lib/seo/page-metadata'

/** Home (/). 404 until the home page is published (T14). */
export function generateMetadata() {
  return systemPageMetadata('home')
}

export default function HomePage() {
  return <SystemPageView pageKey="home" />
}
