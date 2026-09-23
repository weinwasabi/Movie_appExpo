# Movie details screen shows no loading or error state

Status: done

## Problem

`app/movie/[id].tsx` uses only `data` from `useFetch`. While loading it renders "N/A" fields and a broken poster URL (`.../w500undefined`); if the fetch fails, it stays that way with no message.

## Acceptance

- `status === "loading"` shows a spinner.
- `status === "error"` shows `error.message` and the existing back button.
- The poster `Image` renders only once `movie?.poster_path` exists.

Source: found while moving `useFetch` to `status`.

## Comments

Implemented in 212465e (loading/error states, poster guard) and f26f09c (review fixes). Covered by `__tests__/movie-details.test.tsx`.
