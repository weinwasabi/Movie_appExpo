# 02: Sign in

**What to build:** A Guest with an Account signs in from the Profile tab with email and password and gets their Member Profile back. Sign-in and sign-up link to each other, and backing out leaves the person a Guest. See `../spec.md`.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Sign-in screen with email, password, and a show-password toggle, reachable from anywhere and returning to where it was opened from
- [ ] Wrong email or wrong password both show "Email or password is incorrect"
- [ ] Other failures show a generic message
- [ ] Sign-in links to sign-up ("Create account"), and sign-up's "Sign in instead" link reaches sign-in
- [ ] Backing out of sign-in changes nothing
- [ ] Screen tests cover success, the incorrect-credentials message, and backing out
