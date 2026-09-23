# Decide what the Search screen shows while a new query loads

Status: needs-triage

## Problem

Going from "dune" to "dune part", `useMovieSearch` keeps the old `movies` while `status` is `"loading"`. `app/(tabs)/search.tsx` then shows the old grid under a spinner, with the "Search Result for" heading hidden, so the results are unlabelled.

## Decision needed

- **Keep old results** (less flicker): make it explicit with a test in `services/useMovieSearch.test.ts`, and consider dimming the grid.
- **Clear on new query**: `setMovies([])` when a search starts, plus a test.

Source: code review of `feat/movie-search`, finding #4.
