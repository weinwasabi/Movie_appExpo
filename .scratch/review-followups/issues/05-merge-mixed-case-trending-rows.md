# Merge existing mixed-case search rows in Appwrite

Status: ready-for-human

## Problem

Commit ce74b4e started recording search terms lowercased. Rows saved before that (e.g. "Dune" alongside "dune") stay separate and can show the same movie twice in Trending, with a duplicate `movie_id` key warning.

## Steps

In the Appwrite console, for each term with more than one casing: add the counts into the lowercase row, delete the others. New searches will not create more.

## Comments

Also merge **same-case** duplicates. Before issue 04's fix, two concurrent first searches could create two rows with an identical `searchTerm`. The app now increments whichever row the `searchTerm` query returns first, so leftover duplicates split the count. Keep the one with the highest count and delete the rest. It can be any id; new first rows use `term_…` ids.
