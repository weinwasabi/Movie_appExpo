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

**Third review follow-ups (2026-09-25).** These supersede the return and hand-off details above:
- **Returning.** On success a form carrying a save calls `router.dismissTo` for the movie. That pops back to the movie if it's under the form, and puts it in the form's place if it isn't. Without a save the form goes back. The root layout's `unstable_settings.initialRouteName = "(tabs)"` keeps the tabs under any deep-linked screen, so the movie's Go Back and a no-save sign-in both have somewhere to go.
- **Hand-off gates taking.** The Save toggle takes a pending save only after its form's successful submit has handed it off. A held save is left for its own form. A sign-in abandoned earlier that lands for someone else therefore can't take a newer form's save.
- **Closed forms keep out.** A form that has closed does nothing when its submit settles: no navigation, and it doesn't drop the save, which may now belong to a later form. Its own save was already dropped when it closed.
- **One submit at a time.** An `inFlight` ref blocks a second submit before the re-render disables the button. The switch-form links are disabled, and `switchTo` is ignored, while a submit is running. The double-tap guard has no test, because React Native Testing Library won't press a disabled button and can't land a second tap before the re-render.
- **Tests.** Seven new cases, in `guest-save-flow.test.tsx`, cover:
  - deep links with and without a save, and with and without a screen underneath;
  - switching forms mid-submit;
  - a late failure from an abandoned sign-in;
  - a late success from an abandoned sign-in.

  `settle()` waits for in-flight fake calls with `jest.advanceTimersByTimeAsync(0)`, because `renderRouter` fakes timers. Each fix was checked by removing it and seeing its test fail.
- **Left as is.** Two judgement calls from the Standards review:
  - The screens pass `disabled={submitting}` to their switch link rather than getting it from the hook. It is explicit and one line per form.
  - The toggle's remount key repeats the member-id lookup.

  A signed-in Member deep-linked to sign-in still gets the generic error. Nothing in the app sends a Member there.
