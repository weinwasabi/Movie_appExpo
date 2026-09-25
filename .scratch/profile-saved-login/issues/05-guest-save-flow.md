# 05: Guest taps Save, signs in, and the save finishes

**What to build:** A Guest taps the bookmark on a movie's details page, is taken to sign in, and after signing in or signing up lands back on the same movie with it already saved. Backing out saves nothing. See `../spec.md`.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] Guest tapping Save opens sign-in with the movie as the return target and a pending save
- [ ] After successful sign-in, the Member returns to the movie and it is saved (filled bookmark)
- [ ] Switching to sign-up from that sign-in and succeeding has the same result
- [ ] Backing out of sign-in or sign-up drops the pending save; nothing is saved
- [ ] Screen test covers the whole flow, including backing out
