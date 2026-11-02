import { serializeJsonLd, type JsonLd } from '@/lib/seo/json-ld'

/** Structured data script. The content is escaped (no HTML injection through CMS text). */
export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
