# 05: Guest taps Save, signs in, and the save finishes

**What to build:** A Guest taps the bookmark on a movie's details page, is taken to sign in, and after signing in or signing up lands back on the same movie with it already saved. Backing out saves nothing. See `../spec.md`.

**Blocked by:** 02, 03

**Status:** done

- [x] Guest tapping Save opens sign-in with the movie as the return target and a pending save
- [x] After successful sign-in, the Member returns to the movie and it is saved (filled bookmark)
- [x] Switching to sign-up from that sign-in and succeeding has the same result
- [x] Backing out of sign-in or sign-up drops the pending save; nothing is saved
- [x] Screen test covers the whole flow, including backing out

## Comments

**Built:** a Guest's Save toggle pushes `/sign-in?save=<movieId>`. `useAccountForm` reads `save` and forwards it when either form opens the other (`switchTo`, still a `replace`), so Back returns to the movie. On submit the form holds the pending save in `services/pendingSave.ts` *before* signing in and drops it if the submit fails. The only way a save survives is a successful sign-in or sign-up; backing out never had one to drop. On success the form goes back. The movie's Save toggle re-mounts for the new Member, and once `isMovieSaved` answers it takes the pending save and completes it (a no-op if the Member had already saved the movie). If that check fails, the save is dropped rather than kept.

**Review follow-ups:** a form opened with `save` and nothing to go back to (a deep link) drops the save instead of leaving it for the Member's next visit to that movie. The Save toggle can't be tapped while the session is still loading, so a signed-in Member isn't sent to sign-in before the app knows who they are.

**Tests:** `__tests__/guest-save-flow.test.tsx` covers the whole flow with the real movie, sign-in, sign-up, and Profile screens: sign in, create account, "Sign in instead", an already-saved movie, backing out of either form, a failed sign-in then back out then a later sign-in from Profile, and the deep-link case.

**Second review follow-ups (2026-09-25):**
- **Backing out mid-sign-in.** Closing a form drops its pending save. A sign-in that lands after the form was closed goes nowhere: it doesn't save the movie or pop the screen the person went back to. The sign-in itself still completes, so they are a Member.
- **Save kept too long.** Signing out drops any pending save, so it can never be made for a different Member.
- **Return target.** With nothing to go back to (a deep link), a form carrying a save now opens that movie, which finishes the save. Without a save it opens home.
- **Tidying.** The pending save's whole lifecycle lives in `services/pendingSave.ts`: the `saveMovieId` route param, and `usePendingSave` for the forms' hold, drop, hand-off and close. The movie id is a number throughout. `SaveToggle` takes the `Session` instead of a `string | null | undefined` member id. The form's `onPress` no longer returns the sign-in promise.
- **Tests.** `test-support/movieScreens.tsx` holds the shared `dune`, `stub` and Save toggle queries. `fakeBackend.holdNext` can now hold `createEmailPasswordSession`. Each fix was checked by removing it and seeing its test fail.
- **Kept on purpose.** The Save toggle stays untappable while the session loads. Before this ticket it was already untappable while its state was unknown, and without this a signed-in Member would be sent to sign-in.
