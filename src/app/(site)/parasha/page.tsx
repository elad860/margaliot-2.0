import { systemPageMetadata } from '@/lib/seo/page-metadata'
import { SystemPageView } from '@/templates/SystemPageView'

export function generateMetadata() {
  return systemPageMetadata('parasha')
}

export default function ParashaPage() {
  return <SystemPageView pageKey="parasha" />
}
