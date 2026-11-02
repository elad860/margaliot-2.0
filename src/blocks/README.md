# blocks

One folder per reusable block: `config.ts` (Payload schema, T11) and later `Component.tsx` (renderer, T28–T31), registered in `index.ts`.

- `allowed.ts` holds the block slugs and the per-template allow-lists (ARCHITECTURE-PROPOSAL §8.1). `Pages.layout` enforces them in the admin and on save.
- Every block has a `variant` field: it selects the layout only, so the Phase 2 design can add layouts without content changes.
- Renderers use semantic tokens only.
