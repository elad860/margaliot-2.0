import { systemPageMetadata } from '@/lib/seo/page-metadata'
import { SystemPageView } from '@/templates/SystemPageView'

export function generateMetadata() {
  return systemPageMetadata('onlineClasses')
}

export default function OnlineClassesPage() {
  return <SystemPageView pageKey="onlineClasses" />
}
