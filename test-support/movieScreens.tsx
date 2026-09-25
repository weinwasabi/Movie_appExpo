// What screen tests share around a movie's details page: a movie to show, stand-ins for the
// screens a test doesn't exercise, and the Save toggle as a person finds it.

import { Text } from "react-native";
import { screen } from "expo-router/testing-library";
import { fakeBackend } from "@/test-support/fakeAppwrite";

// only the fields the details screen and a Saved Movie read; the rest of MovieDetails is irrelevant
export const dune = {
    id: 438631,
    title: "Dune",
    release_date: "2021-09-15",
    runtime: 155,
    vote_average: 7.8,
    vote_count: 12000,
    overview: "Paul Atreides...",
    genres: [],
    budget: 165_000_000,
    revenue: 402_000_000,
    production_companies: [],
    poster_path: "/dune.jpg",
} as unknown as MovieDetails;

// a screen that only needs to exist so the tabs and stack can mount, and to say it's showing
export const stub = (label: string) => {
    const StubScreen = () => <Text>{label}</Text>;
    return StubScreen;
};

export const saveToggle = () => screen.getByRole("button", { name: "Save" });

// the Save toggle once it's ready to tap: its saved state is known and no change is in flight
export const settledSaveToggle = () => screen.findByRole("button", { name: "Save", disabled: false, busy: false });

// the TMDB ids of every Saved Movie in the fake Appwrite, whoever saved it
export const savedIds = () => fakeBackend.documents.map((document) => document.movie_id);
