# 04: Saved tab and Profile saved count

**What to build:** A Member opens the Saved tab and sees their Saved list in the same 3-column grid as home and search, newest first, and can open or remove Saved Movies from it. Profile shows how many movies the Member has saved. See `../spec.md`.

**Blocked by:** 03

**Status:** done

- [x] Saved list renders from stored Saved Movie data (no TMDB call per movie), newest first
- [x] Refetches when the tab gains focus and on pull-to-refresh
- [x] Tapping a card opens the movie's details page
- [x] Long-press offers "Remove from Saved", which removes immediately without confirmation
- [x] Empty state: "No saved movies yet" with a Browse movies button that goes home
- [x] Guest state: "Sign in to save movies" with Sign in and Create account buttons
- [x] Loading state while the session or list is loading
- [x] Member Profile shows the Saved Movie count
- [x] The unused placeholder saved-card component is replaced or removed

## Comments

**Built:** `app/(tabs)/save.tsx` renders the Saved list with `SavedCard`, which now draws from the Saved Movie snapshot through `PosterCard`. `PosterCard` was split out of `MovieCard` so both grids share one card, and cards now carry `accessibilityRole="link"`. `services/useFocusFetch.ts` loads on every focus and on refresh, keeping only the newest answer. It backs both the Saved list and Profile's "N saved movies" count. Long-press opens a small in-app sheet (an RN `Modal`, not `Alert`, which does nothing on web) with "Remove from Saved" and Cancel. A movie whose removal is on its way stays hidden whatever a reload returns. If the removal fails, the movie comes back with "Couldn't remove <title>. Try again.", and that message clears on refresh or refocus. A failed load shows "Couldn't load your saved movies. Pull to try again." `SignInPrompt` and `Button` are shared by the Saved and Profile tabs.

**Tests:** `__tests__/saved-tab.test.tsx` mounts the real Saved and Profile tabs through `renderRouter`. `renderRouter`'s `getPathname` doesn't survive `await` under RNTL 14's async render, so the movie route's stub prints its id instead.

**For ticket 05:** the Guest Save toggle is still `disabled`, and the Saved tab's Sign in / Create account buttons push those routes with no return target yet.
