# ServeFlow — UI / UX Design Document

**Version:** 1.0 (Phase 1 — Planning)  
**Status:** Draft  
**Developed by:** Zentravi Product Design

---

## 1. Design philosophy

ServeFlow is not a generic SaaS dashboard. It is an intentionally art-directed, light-theme, editorial business-operations workspace for appointment-based service providers.

**Personality:** premium, editorial, modern, confident, calm, functional, refined, distinctive, professional.

**Guiding rules:**
- Light theme by default: warm ivory / soft off-white backgrounds, crisp white surfaces.
- Deep ink/charcoal typography; one distinctive signature accent (cobalt blue).
- Muted secondary tones, restrained status colors, fine borders, subtle depth.
- No purple-blue gradient backgrounds, no excessive glassmorphism, no oversized headings, no repetitive card grids, no meaningless icons, no toy-like animations.
- Deliberate spacing, strong typographic hierarchy, asymmetric layouts where appropriate, careful alignment, meaningful negative space.
- Every layout differs by module purpose — no identical section templates.

---

## 2. Brand identity

| Element | Specification |
|---------|---------------|
| Product name | ServeFlow |
| Tagline | Business operations, simplified. |
| Developer | Zentravi |
| Category | Multi-tenant business operations / appointment booking |

### Signature color — Cobalt
A single, confident accent used sparingly: primary buttons, active states, selected navigation links, focus rings.

- **Cobalt (accent):** `#1D4ED8` — used for primary actions and active states only.
- **Cobalt hover:** `#1D4ED8` at 90% opacity (darker variant for hover states).
- **Cobalt soft:** `#EFF6FF` (10% tint) for subtle backgrounds (e.g. active nav item).

**Contrast ratios (WCAG):**

| Pair | Contrast Ratio | WCAG AA Normal Text (4.5:1) | WCAG AA Large Text (3:1) |
|------|---------------|------------------------------|---------------------------|
| Cobalt `#1D4ED8` on White `#FFFFFF` | 6.7:1 | Pass | Pass |
| Cobalt `#1D4ED8` on Ivory `#FAF7F2` | 6.3:1 | Pass | Pass |
| Cobalt soft `#EFF6FF` on White `#FFFFFF` | 1.2:1 | N/A (decorative only) | N/A |

**Neutral system (light theme):**

| Token | Usage | Exact Hex |
|-------|-------|-----------|
| Background | App canvas | `#FAF7F2` |
| Surface | Cards, sheets, modals | `#FFFFFF` |
| Surface subtle | Secondary panels | `#F5F1EA` |
| Border | Fine dividers | `#E7DFD4` |
| Border hover | Interactive borders | `#D7CCB8` |
| Ink (primary text) | Headings, body | `#1A1816` |
| Muted (secondary text) | Captions, labels | `#6E6458` |
| Soft text | Placeholders, disabled | `#A99D8F` |
| Inverse | Text on dark surfaces | `#FFFFFF` |

**Status colors (restrained, semantic):**

| Status | Exact Hex | Usage | Contrast on White |
|--------|-----------|-------|-------------------|
| Success | `#15803D` | Confirmed, completed | 4.9:1 (Pass AA) |
| Warning | `#B45309` | Pending, upcoming | 4.4:1 (Pass AA large text only) |
| Error | `#B91C1C` | Cancelled, no-show | 4.6:1 (Pass AA) |
| Info | `#475569` | Drafts, notes | 4.5:1 (Pass AA) |

**Notes:** Status colors are used for badges and icons (large text/UI components, 3:1 threshold), not body copy. Warning `#B45309` at 4.4:1 against white passes WCAG AA large text (3:1) but not normal text (4.5:1); it is used only for badge text and icons where large text criteria apply. If used for normal text, increase to `#92400E` (amber-800, 5.2:1).

---

## 3. Typography

A single, strong editorial typeface pairing:

- **Headings:** `Georgia`, `Times New Roman`, serif (or licensed editorial serif). Tight tracking, ink color, sizes scaled by content (h1 ~28–32px, h2 ~22–24px, h3 ~18–20px, h4 ~16px).
- **Body:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`. 15–16px, leading 1.6, ink color.
- **Captions/labels:** 12–13px, letter-spaced (0.05em), muted color, uppercase where appropriate for data labels.
- **Monospace:** `ui-monospace`, `SF Mono`, `monospace`. For numbers/codes where precision matters (prices, IDs).

Hierarchy is driven by size, weight, and color — never by boxes around every element.

---

## 4. Components (shadcn/ui base, customized)

All components customized to the ServeFlow token system:

- **Button:** primary (cobalt), secondary (white with fine border), ghost (text-only), danger (red text, subtle background on hover). Sharp or very slight radius — never pill-shaped by default.
- **Input / Select / Textarea:** white surface, fine border, ink text, muted placeholder, cobalt focus ring.
- **Card:** white surface, fine border, subtle shadow only on elevated surfaces (drawers, modals).
- **Badge:** small, muted background with tinted text; status badges use semantic colors.
- **Dialog / Drawer:** white surface, fine border, subtle depth, motion transitions.
- **Table:** no zebra stripes; fine horizontal borders, ink headers left-aligned, muted body text.
- **Typography components:** `Heading`, `Body`, `Caption`, `Kicker` (small uppercase label above a heading — editorial device).
- **Navigation:** sidebar links (text, cobalt active indicator), top nav (business switcher, search, notifications, profile).
- **Calendar:** custom calendar grid, not a heavy third-party widget; day cells with appointment dots.
- **Toast:** bottom-right, subtle surface, fine border, auto-dismiss, motion entrance.
- **Skeleton:** soft pulse on warm ivory, matching content shape.
- **Empty state:** illustration-free; kicker + heading + short body + primary action. Used for "no appointments," "no customers," "no services," etc.
- **Form validation:** inline error text below the field (`aria-describedby` referencing the error), field border in error red on invalid state, error summary at top of form for multiple errors. No inline tooltips for validation.

No component is used where text alone would suffice.

---

## 5. Navigation

### 5.1 Business dashboard
- **Left sidebar (collapsible):** business identity (name + logo mark) at top; navigation groups: Overview, Appointments, Customers, Services, Staff, Settings, Payments, Notifications. Each item: label + icon (meaningful, consistent line style), active state with cobalt indicator.
- **Top navigation:** business name/switcher, global search, notifications bell, user profile dropdown.
- **Breadcrumbs** on deep pages.

### 5.2 Public booking portal
- Minimal header: business name + back/home.
- Bottom-sticky or inline booking summary on mobile; stepper-style progress on desktop.
- Clear visual distinction from dashboard (lighter, marketing-oriented).

### 5.3 Super-admin
- Separate visual treatment: more utilitarian, table-dense, platform-wide scope. Cobalt retained as accent but with denser information architecture.

---

## 6. Page layouts (module-specific)

No two sections follow the same template:

| Module | Layout approach |
|--------|-----------------|
| **Overview** | Editorial dashboard: asymmetric metric bands (not uniform cards), a primary chart, upcoming appointments list, quick actions. Negative space around the most important number. |
| **Appointments** | Calendar-first: week/month/day grid occupying primary area; side panel for appointment details/actions. |
| **Customers** | Directory: search + filter bar, card list (not a table), customer avatars initials-based. |
| **Services** | Card grid with service cards (price, duration, status toggle), inline edit. |
| **Staff** | Team directory: role badges, working-hours summary, availability indicators. |
| **Settings** | Two-column: left rail of setting groups, right form panel. |
| **Payments** | Table-dense: payment history with status badges, revenue summary above. |
| **Notifications** | List with time grouping, read/unread indicators. |
| **Super-admin** | Dense tables, platform-wide filters, business selector. |

---

## 7. Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 640px) | Sidebar collapses to bottom sheet/drawer; top nav stacks; calendar becomes day list; forms single-column; booking summary sticky bottom. |
| Tablet (640–1024px) | Sidebar collapsible icon-only; calendar week view; two-column forms where sensible. |
| Laptop/Desktop (> 1024px) | Full sidebar + top nav; calendar month/week; multi-column dashboard. |

Touch targets ≥ 44px. Horizontal scroll avoided.

---

## 8. Motion (Framer Motion, `motion/react`)

Used to enhance, never distract:

- **Page transitions:** cross-fade + slight slide between route groups.
- **Sidebar:** slide-in overlay on mobile; smooth collapse/expand on desktop.
- **Staggered entrances:** list items fade up in sequence (60–80ms stagger), dashboard sections appear in order.
- **Hover/tap:** subtle scale (0.98–1.02) on buttons; cobalt color shift.
- **Modal/drawer:** scale + fade in; backdrop blur minimal or none (no glassmorphism).
- **Dropdowns:** fade + scale from trigger.
- **Calendar navigation:** cross-fade between months.
- **Appointment interactions:** drag/reschedule with smooth position transition; status change with micro-checkmark.
- **Chart reveals:** line draws or bars grow on mount.
- **Loading states:** skeleton pulse; spinner only for full-page loads.
- **Toast:** slide up + fade; auto-dismiss with progress bar.
- **Booking workflow:** step transitions with fade + slide.

**Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for ease-out feels; springs (stiffness 300, damping 30) for physical interactions. Duration: 150–250ms for UI, 300–450ms for page transitions.

**Reduced motion:** `useReducedMotion()` — all animations reduced to instant or simple fades when `prefers-reduced-motion: reduce`. No animation delays interaction.

No bouncing, no animation on every element, no slow transitions, no performance-heavy effects.

---

## 9. Accessibility

- Keyboard-navigable all interactive elements; visible focus rings (cobalt).
- ARIA labels on icon buttons, calendar cells, status badges.
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.
- Status communicated by text + icon, never color alone.
- Form errors announced inline with `aria-describedby`.
- Skip-to-content link on public pages.

---

## 10. Deliverables in this doc

- Token system (colors, typography, spacing) → Tailwind config in `packages/config`.
- Component library → `packages/ui` (shadcn base, ServeFlow-customized).
- Page layouts → `apps/web/app/(dashboard)`, `(booking)`, `(super-admin)`.
- Motion patterns → Framer Motion `motion/react` throughout `apps/web`.
