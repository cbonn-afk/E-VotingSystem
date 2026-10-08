# Production Kanban Design QA

## Visual Source

- Production unit dashboard is the visual source of truth.
- Shared treatment: 248px minimum columns, subtle dividers, stage-colored titles and count chips, flat bordered cards, consistent empty states, and theme-aware drop zones.

## Surfaces Checked

- Production dashboard
- Production queue order workflow
- Production staff assignments
- Quality Control assignments
- Tailor assignments
- Packaging assignments
- Production, Tailoring, QC, and Packaging workflow dialogs

## Responsive And Theme Checks

- Desktop horizontal tracks preserve readable card widths and scroll instead of compressing columns.
- Mobile assignment views retain the existing tab-per-stage workflow.
- Dark mode uses `background.paper`, `background.default`, `action.hover`, and `action.selected`; no workflow dialog shell uses a hardcoded white surface.
- Light mode retains clear borders, tonal status colors, and readable empty states.
- Tailoring dialog was opened against a live local order and visually verified in dark mode.
- QC assignment workspace was opened with the seeded QC account and visually verified in dark mode.

## Regression Checks

- Drag/drop handlers, stage transitions, permissions, reprint actions, remarks, assignment controls, and persistence calls were not changed.
- TypeScript: passed.
- Focused production tests: 23 passed.
- Full frontend suite: 51 files, 249 tests passed.
- Next.js production build: passed.

## Result

Passed.
