# Decide what the Search screen shows while a new query loads

Status: done

## Problem

Going from "dune" to "dune part", `useMovieSearch` keeps the old `movies` while `status` is `"loading"`. `app/(tabs)/search.tsx` then shows the old grid under a spinner, with the "Search Result for" heading hidden, so the results are unlabelled.

## Decision needed

- **Keep old results** (less flicker): make it explicit with a test in `services/useMovieSearch.test.ts`, and consider dimming the grid.
- **Clear on new query**: `setMovies([])` when a search starts, plus a test.

Source: code review of `feat/movie-search`, finding #4.

## Comments

**Decision (2026-09-23): keep old results.** Clearing on every new query would flash an empty screen through the 500 ms debounce. The previous results stay up while the next query loads, and:

- the "Search Result for" heading stays, showing `resultsFor` (the query those results came from), so they are never unlabelled
- the result rows dim to 50% (FlatList `columnWrapperStyle`) until the new results land

Pinned by `services/useMovieSearch.test.ts` (the hook keeps `movies` and `resultsFor` while loading) and `__tests__/search-screen.test.tsx` (heading and dimming). To switch to "clear on new query", call `setMovies([])` and `setResultsFor(null)` where the hook sets `"loading"`, and invert that hook test.
