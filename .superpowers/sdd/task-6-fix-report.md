# Task 6: Fix Critical Findings from Sci-Fi Background Code Review

**Status: DONE**

## Changes Made

### C1: Particle-to-particle connecting lines (FIXED)

**File:** `src/components/background/sci-fi-renderer.ts`

- Imported `LINK_DISTANCE` from `sci-fi-config`
- Added `drawLinks()` method with spatial grid optimization:
  - Cell size = `linkDistance` (150px desktop, 100px mobile)
  - Grid buckets background particles (type 0) only
  - Checks pairs within the same cell and 4 adjacent cells (right, down, down-right, down-left)
  - Distance-capped alpha: `(1 - distance/linkDistance) * lineAlpha`
  - Draws with `gl.LINES` using the same shader program, temporarily setting `u_color` to the line color
  - Uses a temporary VAO with position (3-float stride: x, y, alpha) to pass per-vertex alpha through attribute location 3 (`a_alpha`)
  - Restores original state (VAO, u_color, buffer layout) after drawing

### C2: Stale dpr in resize handler (FIXED)

**File:** `src/components/background/SciFiBackground.tsx`

- Made `handleResize` read `window.devicePixelRatio` fresh each call instead of capturing the stale value from the outer `useEffect` closure

## Build Verification

`pnpm build` completed successfully:

- 16 pages built in 21.56s
- No TypeScript errors
- No Vite errors

## Files Modified

1. `src/components/background/sci-fi-renderer.ts` — Added `LINK_DISTANCE` import, `drawLinks()` method
2. `src/components/background/SciFiBackground.tsx` — Fixed dpr capture in `handleResize`
