# Mobile Responsiveness Plan

## Context

GrowthWave Admin is a desktop-only React admin app using TailwindCSS + shadcn/ui. There are zero responsive breakpoints across the entire codebase. The layout uses a fixed `w-56` sidebar (LNB) + `h-14` header + flex-1 main content. All pages use desktop-only grids (`grid-cols-3`, `grid-cols-4`) and wide fixed-width tables (`table-fixed` with ~1400px colgroup).

**Breakpoint strategy:** Use Tailwind's default breakpoints. Primary target is `md` (768px) as the mobile/desktop split. Use `lg` (1024px) for intermediate layouts where needed (e.g., dashboard 4-col grids).

**Approach:** Desktop-first — add responsive overrides that stack/collapse on smaller screens. This avoids touching every existing class and keeps the desktop layout identical.

---

## Guardrails

### Must Have
- Desktop layout remains pixel-identical (no regressions)
- All pages usable on 375px-width screens
- Navigation accessible on mobile
- Tables remain readable (horizontal scroll or card view)
- Dark mode works on all responsive states

### Must NOT Have
- No new npm dependencies (use CSS/Tailwind only for layout changes)
- No redesign of desktop UI
- No changes to business logic or data fetching
- No changes to `components/ui/` (shadcn)

---

## Task Flow (Implementation Order)

### Step 1: Shell Layout + Mobile Navigation
**Files:** `_authed.lazy.tsx`, `Header.tsx`, `LNB.tsx`

**Changes:**

1. **LNB sidebar** — hidden on mobile, shown via off-canvas drawer:
   - Add state `isSidebarOpen` to `AuthedLayout` (or a lightweight context)
   - LNB: `className="fixed inset-y-0 left-0 z-40 w-56 transform transition-transform md:relative md:translate-x-0 md:transform-none"` + conditional `-translate-x-full` when closed on mobile
   - Add a backdrop overlay `<div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={close} />` when open
   - Close sidebar on nav link click (mobile only)

2. **Header** — add hamburger menu button on mobile:
   - Add `<button className="md:hidden" onClick={toggleSidebar}>` with `Menu` icon (lucide) at left side
   - Keep theme toggle + logout on right
   - Reduce horizontal padding: `px-6` -> `px-4 md:px-6`

3. **Main content area** — no structural changes needed; `flex-1 overflow-hidden` already works

**Acceptance Criteria:**
- [ ] On `< md` screens, sidebar is hidden by default and opens via hamburger
- [ ] Sidebar closes on backdrop click and on link navigation
- [ ] On `>= md` screens, sidebar is always visible (identical to current)
- [ ] Header shows hamburger icon only on mobile

---

### Step 2: Dashboard Page (`/dashboard`)
**File:** `dashboard.lazy.tsx`

**Changes:**

1. **Page padding:** `p-6` -> `p-4 md:p-6`

2. **Period filter header:**
   - `flex items-center justify-between` -> stack on mobile: `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`
   - Period buttons: allow horizontal scroll on mobile: `overflow-x-auto`

3. **Row 1 (3 KPI cards):**
   - `grid-cols-3` -> `grid-cols-1 sm:grid-cols-3`

4. **Row 2 (2 KPI cards):**
   - `grid-cols-2` -> `grid-cols-1 sm:grid-cols-2`

5. **Row 3 (2 charts + 1 pie):**
   - `grid-cols-3` -> `grid-cols-1 lg:grid-cols-3`
   - `MonthlyChart` currently uses `col-span-2` (verify in component); keep `lg:col-span-2`

6. **Row 4 (4 cards):**
   - `grid-cols-4` -> `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
   - `MonthlyTaskCount` likely uses `col-span-2`; keep `sm:col-span-2 lg:col-span-2`

7. **Chart components** (MonthlyChart, StatusBreakdown, etc.):
   - Recharts `ResponsiveContainer` should handle width automatically
   - Set `min-h-[200px]` on chart wrappers if not already present

**Acceptance Criteria:**
- [ ] KPI cards stack vertically on mobile, row layout on `sm+`
- [ ] Charts stack vertically on mobile, original 3-col/4-col on `lg+`
- [ ] Period filter doesn't overflow on narrow screens
- [ ] All charts render correctly at mobile widths

---

### Step 3: Tasks Page (`/tasks`)
**File:** `tasks/index.lazy.tsx`, `KanbanColumn.tsx`

**Changes:**

1. **Page padding:** `p-6` -> `p-4 md:p-6`

2. **Header toolbar:**
   - `flex items-center justify-between` -> `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`
   - Search row: `flex items-center gap-2` -> `flex flex-col gap-2 sm:flex-row sm:items-center`
   - Search input: `w-64` -> `w-full sm:w-64`

3. **List mode table:**
   - Wrap in `overflow-x-auto` container (already has `overflow-auto` parent)
   - Add `min-w-[1100px]` to the `<table>` so it scrolls horizontally on mobile
   - This preserves all 11 columns with their fixed widths; users swipe horizontally

4. **Kanban mode:**
   - `grid-cols-4` -> `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
   - Each column gets `min-h-[300px]` on mobile
   - On mobile, consider hiding `proposal` and `lost` columns behind a "more" toggle (optional enhancement; base plan: just stack all 4 cols)

5. **View mode toggle:** Keep as-is (list/kanban buttons work fine at any width)

**Acceptance Criteria:**
- [ ] Table scrolls horizontally on mobile with all columns intact
- [ ] Search bar is full-width on mobile
- [ ] Kanban columns stack vertically on mobile
- [ ] Filter row doesn't overflow

---

### Step 4: Expenses Page (`/expenses`)
**File:** `expenses/index.lazy.tsx`

**Changes:**

1. **Page padding:** `p-6` -> `p-4 md:p-6`

2. **Summary cards:**
   - `grid-cols-3` -> `grid-cols-1 sm:grid-cols-3`

3. **Filter row:**
   - Already has `flex-wrap` — verify it works on mobile
   - Search input `w-56` -> `w-full sm:w-56`
   - Date pickers `w-28` -> keep (small enough)

4. **Table:**
   - Add `min-w-[700px]` to `<table>` for horizontal scroll on narrow screens
   - Or: hide "출처" and "담당자" columns on mobile via `hidden sm:table-cell` on those `<th>`/`<td>` to fit within viewport
   - Recommended: horizontal scroll approach (simpler, no data loss)

5. **Inline edit row:** Already uses the same table structure; horizontal scroll covers it

6. **ExpenseFormDialog:** Already `sm:max-w-md` — works fine on mobile (shadcn Dialog is responsive by default)

**Acceptance Criteria:**
- [ ] Summary cards stack on mobile
- [ ] Table is horizontally scrollable on narrow screens
- [ ] Filters don't overflow
- [ ] Dialog form usable on mobile

---

### Step 5: Remaining Pages (Clients, Contacts, Trash, Settings pages)
**Files:** `clients/index.lazy.tsx`, `clients/$clientId/index.lazy.tsx`, `contacts/index.lazy.tsx`, `trash/index.lazy.tsx`, `expense-categories/index.lazy.tsx`, `marketing-types/index.lazy.tsx`

**Changes:**

1. **Clients list:**
   - Page padding: `p-6` -> `p-4 md:p-6`
   - Header/search: stack on mobile (same pattern as Tasks)
   - Table: add `min-w-[600px]` for horizontal scroll, or hide "메모" column on mobile
   - Action buttons: `opacity-0 group-hover:opacity-100` won't work on touch — add `sm:opacity-0 sm:group-hover:opacity-100` (always visible on mobile)

2. **Client detail page:** Read and apply same padding + stack patterns

3. **Contacts:**
   - Page padding: `p-6` -> `p-4 md:p-6`
   - Action buttons row: `flex items-center gap-2` -> `flex flex-wrap gap-2`
   - Grid header + rows: `grid-cols-3` works fine at most widths; consider `grid-cols-1 sm:grid-cols-3` only if needed
   - Drag selection: won't work on touch — this is acceptable for an admin tool; touch users can use the "전체 연락처 복사" button
   - Hide "선택 연락처 복사" button on mobile since drag-select is desktop-only: `hidden sm:inline-flex`

4. **Trash:**
   - Already `max-w-3xl mx-auto` — responsive-friendly
   - Trash item rows: `flex items-center justify-between` -> `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between` for long content
   - Tab bar: add `overflow-x-auto` for safety

5. **Expense Categories + Marketing Types:**
   - Already `max-w-xl mx-auto` — responsive-friendly
   - Page padding: `p-6` -> `p-4 md:p-6`
   - Action buttons on hover: same touch fix as Clients (`sm:opacity-0 sm:group-hover:opacity-100`)
   - These pages are already simple lists; minimal changes needed

**Acceptance Criteria:**
- [ ] All page paddings reduced on mobile
- [ ] Tables scroll horizontally or hide non-essential columns
- [ ] Hover-only action buttons are always visible on mobile
- [ ] Contacts action bar wraps properly
- [ ] Trash items don't overflow on narrow screens

---

### Step 6: Task Form Pages + Client Detail
**Files:** `tasks/new.lazy.tsx`, `tasks/$taskId/edit.lazy.tsx`, `tasks/$taskId/index.lazy.tsx`, `clients/$clientId/index.lazy.tsx`

**Changes:**

1. **Task form (new + edit):**
   - These likely use `grid-cols-2` for form fields — change to `grid-cols-1 sm:grid-cols-2`
   - Page padding adjustments
   - Form should be naturally responsive if it's within a `max-w-*` container

2. **Task detail page:**
   - Info grid likely uses multi-column layout — stack on mobile
   - Page padding adjustments

3. **Client detail page:**
   - Same pattern: stack info sections on mobile

**Acceptance Criteria:**
- [ ] Form fields stack to single column on mobile
- [ ] Detail pages are readable on mobile
- [ ] All interactive elements (buttons, inputs) are touch-friendly (min 44px tap target)

---

## Success Criteria

1. Every page is usable on a 375px-wide screen without horizontal overflow (except intentional table scroll)
2. Desktop layout is pixel-identical to current state
3. Mobile navigation (hamburger + drawer) works smoothly
4. No new dependencies added
5. Build passes with zero errors
6. Dark mode works correctly on all responsive states

## Estimated Complexity: MEDIUM

- ~12-15 files to modify
- Majority of changes are Tailwind class additions (non-breaking)
- Highest complexity: Step 1 (sidebar drawer requires new state) and Step 3 (task table/kanban)
- Lowest complexity: Steps 5-6 (simple padding + grid changes)
