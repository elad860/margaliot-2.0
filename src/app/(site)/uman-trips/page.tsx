import { systemPageMetadata } from '@/lib/seo/page-metadata'
import { SystemPageView } from '@/templates/SystemPageView'

export function generateMetadata() {
  return systemPageMetadata('umanTrips')
}

export default function UmanTripsPage() {
  return <SystemPageView pageKey="umanTrips" />
}
