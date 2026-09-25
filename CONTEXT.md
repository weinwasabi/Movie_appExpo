# Mobile Movie App

A movie browser over TMDB. Anyone can browse and search; signed-in people keep a personal list of movies they've saved.

## Language

### People

**Guest**:
Someone using the app without being signed in. Can browse, search, and contribute to Trending, but has no Saved list.
_Avoid_: Anonymous user, visitor

**Member**:
Someone signed in with an email and password. Owns exactly one Saved list.
_Avoid_: User (ambiguous with Guest), account holder

**Account**:
A Member's identity: their email, password, and name.
_Avoid_: Profile (that's the screen, not the identity)

### Movies

**Saved Movie**:
A movie a Member has put on their Saved list. A movie is either saved or not, at most once per Member; there are no ratings, statuses, or multiple lists.
_Avoid_: Bookmark, favourite, watchlist item

**Saved list**:
All of one Member's Saved Movies, newest first. Private to that Member.
_Avoid_: Watchlist, favourites, collection

**Trending**:
The global ranking of movies by how often people search for them, counting searches from Guests and Members alike and never tied to who searched.
_Avoid_: Popular (TMDB's own term for a different ranking)
