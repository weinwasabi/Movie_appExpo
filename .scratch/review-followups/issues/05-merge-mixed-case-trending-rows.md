# Merge existing mixed-case search rows in Appwrite

Status: done

## Problem

Commit ce74b4e started recording search terms lowercased. Rows saved before that (e.g. "Dune" alongside "dune") stay separate and can show the same movie twice in Trending, with a duplicate `movie_id` key warning.

## Steps

In the Appwrite console, for each term with more than one casing: add the counts into the lowercase row, delete the others. New searches will not create more.

## Comments

Also merge **same-case** duplicates. Before issue 04's fix, two concurrent first searches could create two rows with an identical `searchTerm`. The app now increments whichever row the `searchTerm` query returns first, so leftover duplicates split the count. Keep the one with the highest count and delete the rest. It can be any id; new first rows use `term_…` ids.

**Done (2026-09-25):** merged by a one-off wizard through the Appwrite REST API with a temporary server key. It read 9 rows and fixed 4 terms: `"gladiator "` merged into `gladiator` (count 2), and `Avatar`, `Avengers`, `Iron Man` renamed to lowercase. The re-check found every `searchTerm` unique and normalized (8 rows). No same-case duplicates existed. The unique `searchTerm` index and the key deletion were console steps; confirm them in the console if unsure.
