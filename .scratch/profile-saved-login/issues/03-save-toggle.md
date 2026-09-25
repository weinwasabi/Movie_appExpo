# 03: Save and unsave from the movie details page

**What to build:** A Member taps the bookmark in the movie details header and the movie becomes a Saved Movie: the icon fills immediately and stays filled on reopening the movie or restarting the app; tapping again unsaves it. Failures revert the icon with a short error. Saved Movies are private to their Member and can't be duplicated. See `../spec.md`.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] New saved-movies collection with document-level security; each Saved Movie readable, updatable, and deletable only by its Member
- [ ] A Saved Movie stores the Member id, TMDB movie id, title, poster URL, release year, and rating
- [ ] Document id derived from Member id and movie id, plus a unique index on (Member, movie); saving an already-saved movie is a no-op, unsaving an unsaved one is a no-op
- [ ] Saved-movies service can check, save, unsave, list newest first, and count; covered by service-level tests in the style of the Trending service test
- [ ] Bookmark toggle in the details header: filled when saved, outlined otherwise; flips optimistically and reverts with an error on failure
- [ ] For a Guest the bookmark shows outlined and does nothing yet (ticket 05 wires it up)
- [ ] The setup wizard creates the collection, attributes, permissions, and unique index, and writes its id to `.env`; `.env.example` lists the new variable
