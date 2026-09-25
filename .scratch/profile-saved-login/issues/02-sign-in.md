# 02: Sign in

**What to build:** A Guest with an Account signs in from the Profile tab with email and password and gets their Member Profile back. Sign-in and sign-up link to each other, and backing out leaves the person a Guest. See `../spec.md`.

**Blocked by:** 01

**Status:** done

- [x] Sign-in screen with email, password, and a show-password toggle, reachable from anywhere and returning to where it was opened from
- [x] Wrong email or wrong password both show "Email or password is incorrect"
- [x] Other failures show a generic message
- [x] Sign-in links to sign-up ("Create account"), and sign-up's "Sign in instead" link reaches sign-in
- [x] Backing out of sign-in changes nothing
- [x] Screen tests cover success, the incorrect-credentials message, and backing out

## Comments

**Built:** sign-in shares its fields, show-password toggle, inline problem, and Back button with sign-up (`components/AccountForm.tsx`). Each form `router.replace`s to the other, so backing out of whichever one is showing returns to where the first was opened from. If a session is already open on the device (one the app couldn't confirm at start, so it came up as a Guest), sign-in ends it and opens a new one, so it can't carry on as someone else. `user_invalid_credentials` is confirmed against the project's live Appwrite (401 on a sign-in with an unknown email, 2026-09-25); `user_session_already_exists` and `user_already_exists` still await a real run.
