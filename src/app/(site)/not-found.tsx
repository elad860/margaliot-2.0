import { PLACEHOLDER } from '@/config/placeholder'

/**
 * 404 inside the site layout (unstyled stub, T14). Status 404 and noindex.
 * The designed 404 with links to home, next trip and contact comes in T36.
 */
export default function NotFound() {
  return (
    <>
      <h1>הדף לא נמצא</h1>
      <p>{PLACEHOLDER}</p>
    </>
  )
}
