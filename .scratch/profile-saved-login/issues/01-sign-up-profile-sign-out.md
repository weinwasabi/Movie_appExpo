# 01: Sign up, see yourself on Profile, sign out

**What to build:** A Guest opens the Profile tab, taps Create account, enters name, email, and password, and lands back on Profile as a Member showing their initial, name, and email. Sign out returns Profile to its Guest prompt. Restarting the app keeps a Member signed in; an expired or revoked session comes back as a Guest. This slice introduces the session (loading / Guest / Member) that every later ticket reads, and settles the test harness for the feature. See `../spec.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The app knows on start whether it's a Guest or a Member; Profile shows a spinner until it does, never a flash of the Guest state
- [x] Guest Profile shows a short prompt with Sign in and Create account buttons (Sign in may lead to a placeholder until ticket 02)
- [x] Sign-up asks for name, email, and password, with a show-password toggle and no confirm field
- [x] Successful sign-up signs the Member in and returns them to where they came from
- [x] Inline errors: password shorter than 8 characters; "An account with this email already exists" with a "Sign in instead" link; anything else as a generic message
- [x] Backing out of sign-up changes nothing
- [x] Member Profile shows initial, name, email, and a Sign out button
- [x] Sign out switches Profile to its Guest state immediately
- [ ] A Member stays signed in across app restarts (verify `react-native-appwrite` session persistence in Expo Go)
- [x] The setup wizard enables Email/Password auth
- [x] Screen tests render the real screens with a faked `react-native-appwrite` (Account and Databases) and mocked TMDB; `expo-router/testing-library`'s `renderRouter` is verified against expo-router 57, or the fallback of mocking `router` is chosen and noted in this ticket

## Comments

**Test harness (decided while building this ticket):** `expo-router/testing-library`'s `renderRouter` works with expo-router 57, so screen tests mount the real root and tabs layouts with real navigation. Two caveats for tickets 02–05:

- Its `toHavePathname` matcher is broken with `@testing-library/react-native` 14 (`render` became async, so the pathname helpers land on the promise). Assert on what's on screen instead.
- Await every `fireEvent` call, or React warns about overlapping `act()` calls.

`test-support/fakeAppwrite.ts` is an in-memory Appwrite Account (409 on a taken email, 401 on bad credentials, no session, or a session already open) with `fakeBackend.addMember`, `failNext(method, error)`, and `currentAccountGate` for the loading state. `Databases` is an empty stub until ticket 03 needs it. Screens that call TMDB are swapped for stubs in these tests rather than mocking TMDB, since no screen under test reads it. `.css` imports map to an empty module in the Jest config so the root layout can mount.

**Still open:** "A Member stays signed in across app restarts" needs a device check in Expo Go. `react-native-appwrite` keeps the session cookie in the native cookie store (`fetch` with `credentials: 'include'`), which normally survives restarts, but Jest can't prove it. The Appwrite error types the sign-up flow relies on (`user_already_exists`, `user_invalid_credentials`, `user_session_already_exists`) also come from Appwrite's docs, not the SDK, so the first real sign-up confirms them.
