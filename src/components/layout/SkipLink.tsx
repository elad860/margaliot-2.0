/** First focusable element on every page; jumps keyboard users past the header to <main id="main">. */
export function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      דלג לתוכן הראשי
    </a>
  )
}
