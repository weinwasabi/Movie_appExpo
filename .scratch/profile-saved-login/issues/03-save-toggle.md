# 03: Save and unsave from the movie details page

**What to build:** A Member taps the bookmark in the movie details header and the movie becomes a Saved Movie: the icon fills immediately and stays filled on reopening the movie or restarting the app; tapping again unsaves it. Failures revert the icon with a short error. Saved Movies are private to their Member and can't be duplicated. See `../spec.md`.

**Blocked by:** 01

**Status:** done

- [x] New saved-movies collection with document-level security; each Saved Movie readable, updatable, and deletable only by its Member
- [x] A Saved Movie stores the Member id, TMDB movie id, title, poster URL, release year, and rating
- [x] Document id derived from Member id and movie id, plus a unique index on (Member, movie); saving an already-saved movie is a no-op, unsaving an unsaved one is a no-op
- [x] Saved-movies service can check, save, unsave, list newest first, and count; covered by service-level tests in the style of the Trending service test
- [x] Bookmark toggle in the details header: filled when saved, outlined otherwise; flips optimistically and reverts with an error on failure
- [x] For a Guest the bookmark shows outlined and does nothing yet (ticket 05 wires it up)
- [x] The setup wizard creates the collection, attributes, permissions, and unique index, and writes its id to `.env`; `.env.example` lists the new variable

## Comments

**Built:** `services/savedMovies.ts` (check, save, unsave, list newest first, count) over a new collection; the document id is `documentIdFor("saved", "<memberId>:<movieId>")`, sharing the FNV-1a helper now in `services/documentId.ts` with the Trending term id. `components/SaveToggle.tsx` sits in the details header. It is `accessibilityRole="button"`, labelled "Save", with `selected` for saved; a tap while a change is on its way is ignored, so a save and an unsave can't reach Appwrite out of order. If the saved check fails, the toggle stays untappable with a short message.

**Test harness additions:** `test-support/fakeAppwrite.ts` now has an in-memory `Databases` with document-level security (reads, deletes, and lists see only documents whose permissions name the session's roles; creating needs a session and can't grant roles the creator lacks), `Query.equal`/`orderDesc`/`orderAsc`/`limit`, `failNext` for Databases methods, and `holdNext(method)` to hold a call until released. `fireEvent.press` resolves with the handler's return value, so `onPress` must not return the save's promise, or a held save deadlocks the test. Don't `screen.unmount()` mid-test with `renderRouter`: later tests in the file then fail to render.

**For ticket 04:** `listSavedMovies` sends no `Query.limit`, so Appwrite returns at most 25; the Saved tab needs to page (cursor) or raise the limit.

**For ticket 05:** the Guest's toggle is `disabled`; enable it when wiring the pending save.

**Still open:** the collection setup is in the wizard (stages 9–10) but unverified against a live Appwrite console.
