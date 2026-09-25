# 04: Saved tab and Profile saved count

**What to build:** A Member opens the Saved tab and sees their Saved list in the same 3-column grid as home and search, newest first, and can open or remove Saved Movies from it. Profile shows how many movies the Member has saved. See `../spec.md`.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Saved list renders from stored Saved Movie data (no TMDB call per movie), newest first
- [ ] Refetches when the tab gains focus and on pull-to-refresh
- [ ] Tapping a card opens the movie's details page
- [ ] Long-press offers "Remove from Saved", which removes immediately without confirmation
- [ ] Empty state: "No saved movies yet" with a Browse movies button that goes home
- [ ] Guest state: "Sign in to save movies" with Sign in and Create account buttons
- [ ] Loading state while the session or list is loading
- [ ] Member Profile shows the Saved Movie count
- [ ] The unused placeholder saved-card component is replaced or removed
