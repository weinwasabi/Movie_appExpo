# Spec: Profile, Saved Movies, and Login

Status: ready-for-agent

Vocabulary follows `CONTEXT.md`: **Guest**, **Member**, **Account**, **Saved Movie**, **Saved list**, **Trending**.

## Problem Statement

The Saved and Profile tabs are placeholders: an icon and a label. Someone who finds a movie they want to watch later has nowhere to keep it, and there's no notion of who is using the app, so nothing personal can persist between sessions or devices.

## Solution

Add optional email-and-password Accounts backed by Appwrite Auth. Anyone can keep browsing, searching, and feeding Trending as a Guest. Signing up or signing in makes them a Member, who gets a private Saved list: a bookmark toggle on every movie's details page saves or unsaves it, the Saved tab shows the list, and the Profile tab shows who they are, how many movies they've saved, and a way to sign out. A Guest who taps Save is sent to sign in and, once signed in, returned to the movie with the save completed.

## User Stories

### Browsing stays open

1. As a Guest, I want to browse, search, and open movie details without an Account, so that I can use the app before deciding to sign up.
2. As a Guest, I want my searches to count toward Trending, so that Trending reflects everyone's interest.
3. As a Member, I want my searches to count toward Trending exactly as they did before, without being tied to me, so that signing in doesn't change what I share.

### Signing up

4. As a Guest, I want to create an Account with my name, email, and password, so that I can keep a Saved list.
5. As a Guest, I want a show-password toggle on the sign-up form, so that I can check what I typed without a confirm field.
6. As a Guest, I want to be told inline when my password is shorter than 8 characters, so that I can fix it before submitting again.
7. As a Guest, I want to be told inline when an Account already exists for my email, with a "Sign in instead" link, so that I don't create a duplicate and can get to the right screen in one tap.
8. As a Guest, I want to be signed in immediately after signing up, so that I don't have to enter my details twice.
9. As a Guest, I want to return to wherever I came from after signing up, so that my flow isn't interrupted.
10. As a Guest, I want to reach sign-up from the Profile tab, the Saved tab, and the sign-in screen, so that I can find it wherever I am.

### Signing in

11. As a Guest with an Account, I want to sign in with my email and password, so that I get my Saved list back.
12. As a Guest, I want a single "Email or password is incorrect" message when sign-in fails, so that the form doesn't reveal which emails have Accounts.
13. As a Guest, I want to reach sign-in from the Profile tab, the Saved tab, and the sign-up screen, so that I can find it wherever I am.
14. As a Guest, I want to back out of sign-in or sign-up without anything changing, so that I'm never trapped in a form.
15. As a Member, I want to stay signed in across app restarts, so that I don't sign in every time I open the app.
16. As a Member whose session has expired or been revoked, I want the app to treat me as a Guest again, so that I'm not shown a broken signed-in state.
17. As anyone opening the app, I want Saved and Profile to wait until the app knows whether I'm signed in, so that I don't see the Guest screen flash before my Saved list.

### Saving a movie

18. As a Member, I want a bookmark toggle in the movie details header, so that I can save the movie I'm looking at.
19. As a Member, I want the toggle to show filled when the movie is already saved and outlined when it isn't, so that I can see its state at a glance.
20. As a Member, I want the toggle to change the moment I tap it, so that saving feels instant.
21. As a Member, I want the toggle to revert and show a short error if saving or unsaving fails, so that what I see matches what's stored.
22. As a Member, I want tapping the toggle on a saved movie to unsave it, so that I can change my mind from the same place.
23. As a Member, I want double-tapping Save or saving from two devices to leave just one Saved Movie, so that my Saved list never shows duplicates.
24. As a Guest, I want to see the bookmark toggle too, so that I know saving is possible.
25. As a Guest, I want tapping Save to take me to sign in, so that I can start saving without hunting for the Profile tab.
26. As a Guest who signs in or signs up after tapping Save, I want to land back on the same movie with it already saved, so that I don't have to tap Save again.
27. As a Guest who backs out of sign-in after tapping Save, I want nothing to be saved, so that backing out means no.

### The Saved tab

28. As a Member, I want the Saved tab to show my Saved Movies in the same 3-column poster grid as home and search, so that it feels like the rest of the app.
29. As a Member, I want my Saved list ordered newest first, so that what I just saved is at the top.
30. As a Member, I want the Saved list to show title, poster, year, and rating without waiting on TMDB for each movie, so that the tab loads quickly.
31. As a Member, I want to tap a Saved Movie to open its details page, so that I can read about it again.
32. As a Member, I want to pull to refresh the Saved tab, so that I can pick up saves made on another device.
33. As a Member, I want a movie I just saved on the details page to appear when I go back to the Saved tab, so that the list is always current.
34. As a Member, I want to long-press a Saved Movie and choose "Remove from Saved", so that I can tidy the list without opening each movie.
35. As a Member, I want removal to happen straight away without a confirmation dialog, so that tidying up is quick; saving again is one tap anyway.
36. As a Member with nothing saved, I want to see "No saved movies yet" and a "Browse movies" button that goes home, so that I know what to do next.
37. As a Guest, I want the Saved tab to say "Sign in to save movies" with Sign in and Create account buttons, so that I understand why it's empty.

### The Profile tab

38. As a Member, I want the Profile tab to show my initial, name, and email, so that I know which Account I'm signed in to.
39. As a Member, I want the Profile tab to show how many movies I've saved, so that the screen tells me something useful.
40. As a Member, I want a Sign out button on Profile, so that I can leave a shared device.
41. As a Member who signs out, I want Saved and Profile to switch to their Guest screens straight away, so that the next person doesn't see my list.
42. As a Guest, I want the Profile tab to show a short prompt with Sign in and Create account buttons, so that I know accounts exist and how to get one.

### Privacy between Members

43. As a Member, I want my Saved list to be visible only to me, so that other people can't see what I've saved.
44. As a Member who signs in on a device another Member just signed out of, I want to see only my own Saved list, so that nothing leaks between Accounts.

### Setting up a fresh clone

45. As a developer, I want the setup wizard to enable Email/Password auth and create the saved-movies collection with its permissions and unique index, so that a fresh clone works without reading the Appwrite console docs.
46. As a developer, I want the new collection ID listed in `.env.example`, so that I know which variable to set.

## Implementation Decisions

- **Login is optional.** No screen is gated at app start. Only the Saved list, the Save toggle's action, and the Profile details need a Member.
- **Appwrite Auth, email and password.** Use the existing Appwrite client from `react-native-appwrite`; add its `Account` service alongside `Databases`. No second backend.
- **Sign-up fields:** name, email, password (Appwrite's 8-character minimum), with a show-password toggle and no confirm field. Sign-up creates the Account and then creates an email-password session in the same flow, so the Member is signed in on success.
- **Error mapping on the forms** is inline, under the form:
  - invalid credentials → "Email or password is incorrect" (never which one);
  - Account already exists (Appwrite conflict) → "An account with this email already exists" with a "Sign in instead" link;
  - password too short → the 8-character rule;
  - anything else → a generic failure message using the project's existing error-to-message helper.
- **Session module.** A single session provider at the root layout owns the current Member (or Guest) and exposes: the current state (`loading`, `guest`, or `member` with id, name, email), `signUp`, `signIn`, and `signOut`. On app start it asks Appwrite for the current Account; a failure (no session, expired, revoked) resolves to `guest`. Screens that need to know read it through a hook. Whether `react-native-appwrite` persists the session across restarts in Expo Go without extra storage is to be verified during implementation; the requirement is that it does.
- **Auth screens** are two stack routes outside the tabs, sign-in and sign-up, reachable from anywhere. Each accepts an optional "return to" target and an optional pending action. On success they navigate back to the return target; backing out leaves everything unchanged.
- **Pending save.** When a Guest taps Save on a movie's details page, the app opens sign-in with the movie as the return target and "save this movie" as the pending action. After a successful sign-in or sign-up, returning to the movie completes the save. If the Guest backs out, the pending action is dropped.
- **Saved-movies module.** A new service alongside the existing Trending service, over a new Appwrite collection. Its interface: list the current Member's Saved Movies newest first, check whether a given movie is saved, save a movie, unsave a movie, and count the Member's Saved Movies.
- **Saved Movie schema.** One document per (Member, TMDB movie). Fields: owning Member id, TMDB movie id, title, poster URL (built with the existing poster-URL helper), release year, rating, and the Appwrite creation timestamp for ordering. This is a snapshot taken at save time; the details page still fetches fresh data from TMDB.
- **At most one Saved Movie per Member per movie.** The document id is derived deterministically from the Member id and TMDB movie id, following the precedent of the search-term id in the Trending service, and the collection has a unique index on (Member id, movie id). Saving a movie that's already saved is a no-op, not an error: a conflict on create is treated as success. Unsaving a movie that isn't saved is also a no-op.
- **Privacy.** The collection uses document-level security. Each Saved Movie is created with read, update, and delete permission for its owning Member only. Collection-level permission lets signed-in users create documents and grants no read to anyone.
- **Save toggle** in the movie details header: filled bookmark when saved, outlined when not or when Guest. Toggling is optimistic: the icon flips immediately, the service call runs, and on failure the icon flips back and a short error is shown.
- **Saved tab** reuses the existing movie-card grid (3 columns) with the Saved Movie snapshot as its data, supports pull-to-refresh, and refetches when the tab gains focus. Long-press on a card offers "Remove from Saved", which removes immediately. The unused placeholder saved-card component may be replaced or removed.
- **Profile tab** shows the Member's initial in a circle, name, email, Saved Movie count, and a Sign out button. No editing.
- **Guest states.** Saved: "Sign in to save movies" plus Sign in / Create account. Profile: a short prompt plus Sign in / Create account. While the session is `loading`, both show a spinner, not the Guest state.
- **Sign out** deletes the current session and sets the session state to `guest` immediately, so Saved and Profile switch to their Guest screens.
- **Trending is unchanged.** Searches are still counted globally and anonymously, from Guests and Members alike.
- **Setup.** Extend the existing interactive setup wizard to enable Email/Password auth, create the saved-movies collection with its attributes, document-level security, collection permissions, and unique index, and write the new collection id into `.env`. Add the new `EXPO_PUBLIC_*` collection id variable to `.env.example`.

## Testing Decisions

- **Good tests exercise external behaviour**: what a person sees and can do on screen, and what the app asks Appwrite and TMDB to do. They don't assert on internal state, hook internals, or component structure.
- **One primary seam: real screens, fake outside services.**
  - Fake `react-native-appwrite` at the package boundary, extending the existing fake `Databases` in the Trending service test with a fake `Account` (create account, create email-password session, get current account, delete session) that can be scripted to succeed, fail with specific Appwrite error codes, or report no session.
  - Mock the TMDB API module, as the existing movie-details screen test does.
  - Drive screens through `expo-router/testing-library`'s `renderRouter` so navigation is real. This is what lets a test cover a Guest tapping Save, signing in, returning to the movie, and seeing it saved, and a Member signing out and seeing Saved and Profile switch to their Guest screens.
  - Verify early that `renderRouter` works with expo-router 57. If it doesn't, fall back to the current pattern of mocking `router`, and test the return-to-movie flow as "navigation back was requested and the save was performed".
- **Service-level tests** for the saved-movies module, in the style of the existing Trending service test: the deterministic document id for (Member, movie), per-Member permissions on create, a conflict on create treated as already-saved, unsave of a missing document treated as success, newest-first listing, and counting.
- **Screen-level tests** cover: sign-up success and each inline error; sign-in success and the generic incorrect-credentials message; backing out of either form; session restore on start (Member) and expired session (Guest); the Save toggle's saved/unsaved display, optimistic flip, and revert on failure; the Guest-taps-Save flow including backing out; the Saved tab's grid, newest-first order, empty state, Guest state, loading state, long-press removal, and refetch on focus; the Profile tab's Member details, Saved Movie count, sign-out, and Guest state.
- **Prior art:** the Trending service test for the Appwrite fake and conflict handling; the movie-details, search-screen, and search-bar screen tests for rendering screens with React Native Testing Library and mocked services.
- Run `npm test`, `npx tsc --noEmit`, and `npx expo lint` before closing each ticket.

## Out of Scope

- Email verification and password reset. Both need a deep-link or hosted page to complete Appwrite's email link; build them together later.
- Account deletion. The Appwrite client SDK can only block an Account; real deletion needs an Appwrite Function with an API key. Required before any App Store release.
- OAuth or social sign-in (Google, Apple).
- Guest saving and merging guest saves into an Account on sign-up.
- Multiple lists, watched status, ratings, or notes on Saved Movies.
- Saving or unsaving from movie cards on home, search, or Trending.
- Editing name, email, or password.
- Per-Member search history, or tying Trending searches to Members.
- Refreshing a Saved Movie's stored title, poster, year, or rating when TMDB changes them.

## Further Notes

- The login-and-session work blocks everything else: the Save toggle, the Saved tab, and the Profile tab all read the session state.
- The deterministic document id plus unique index repeats the fix from issues 04 and 05 in `.scratch/review-followups/` for duplicate Trending rows; follow that precedent rather than a read-then-write check.
- No ADRs were written for these decisions; each is either cheap to reverse or the obvious choice for this stack. Terms are defined in `CONTEXT.md`.
