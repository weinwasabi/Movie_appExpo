import { AppwriteException } from "react-native-appwrite";
import { countSavedMovies, isMovieSaved, listSavedMovies, saveMovie, unsaveMovie } from "@/services/savedMovies";
import { fakeBackend } from "@/test-support/fakeAppwrite";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

// only the fields a Saved Movie snapshots; the rest of MovieDetails is irrelevant here
const movie = (overrides: Partial<MovieDetails>) =>
    ({ id: 438631, title: "Dune", poster_path: "/dune.jpg", release_date: "2021-09-15", vote_average: 7.8, ...overrides }) as MovieDetails;

const dune = movie({});
const arrival = movie({ id: 329865, title: "Arrival", poster_path: "/arrival.jpg", release_date: "2016-11-10", vote_average: 7.6 });

// the device's session is whoever signed in last, as with a real Appwrite cookie
const signIn = (name: string) => {
    const member = fakeBackend.addMember({ name, email: `${name}@example.com`, password: "password1", signedIn: true });
    return member.$id;
};
const switchTo = (memberId: string) => (fakeBackend.sessionAccountId = memberId);

afterEach(() => fakeBackend.reset());

test("saving stores a snapshot of the movie for the Saved list", async () => {
    const ada = signIn("ada");

    await saveMovie(ada, dune);

    expect(await listSavedMovies(ada)).toEqual([
        {
            movieId: 438631,
            title: "Dune",
            posterUrl: "https://image.tmdb.org/t/p/w500/dune.jpg",
            releaseYear: 2021,
            rating: 7.8,
            savedAt: expect.any(String),
        },
    ]);
});

test("a movie with no poster or release date is saved without them", async () => {
    const ada = signIn("ada");

    await saveMovie(ada, movie({ poster_path: null, release_date: "" }));

    const [saved] = await listSavedMovies(ada);
    expect(saved.posterUrl).toBeNull();
    expect(saved.releaseYear).toBeNull();
});

test("only the Member who saved a movie can read, change, or delete it", async () => {
    const ada = signIn("ada");

    await saveMovie(ada, dune);

    expect(fakeBackend.documents[0].$permissions).toEqual([
        `read("user:${ada}")`,
        `update("user:${ada}")`,
        `delete("user:${ada}")`,
    ]);
});

test("another Member doesn't see or remove someone else's Saved Movie", async () => {
    const ada = signIn("ada");
    await saveMovie(ada, dune);
    const grace = signIn("grace");

    expect(await isMovieSaved(grace, dune.id)).toBe(false);
    expect(await listSavedMovies(grace)).toEqual([]);
    await unsaveMovie(grace, dune.id);

    switchTo(ada);
    expect(await isMovieSaved(ada, dune.id)).toBe(true);
});

test("two Members can each save the same movie", async () => {
    const ada = signIn("ada");
    await saveMovie(ada, dune);
    const grace = signIn("grace");

    await saveMovie(grace, dune);

    expect(await isMovieSaved(grace, dune.id)).toBe(true);
    expect(fakeBackend.documents).toHaveLength(2);
});

test("saving an already-saved movie keeps just one Saved Movie", async () => {
    const ada = signIn("ada");

    await Promise.all([saveMovie(ada, dune), saveMovie(ada, dune)]);
    await saveMovie(ada, dune);

    expect(await countSavedMovies(ada)).toBe(1);
});

test("a Saved Movie's id is the same valid Appwrite id every time", async () => {
    const ada = signIn("ada");
    await saveMovie(ada, dune);
    const first = fakeBackend.documents[0].$id;
    await unsaveMovie(ada, dune.id);

    await saveMovie(ada, dune);

    expect(fakeBackend.documents[0].$id).toBe(first);
    // Appwrite ids: a-z A-Z 0-9 . - _, no leading special char, at most 36 chars
    expect(first).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/);
});

test("unsaving removes the Saved Movie", async () => {
    const ada = signIn("ada");
    await saveMovie(ada, dune);

    await unsaveMovie(ada, dune.id);

    expect(await isMovieSaved(ada, dune.id)).toBe(false);
    expect(fakeBackend.documents).toEqual([]);
});

test("unsaving a movie that isn't saved does nothing", async () => {
    const ada = signIn("ada");

    await expect(unsaveMovie(ada, dune.id)).resolves.toBeUndefined();
});

test("checks whether a movie is saved", async () => {
    const ada = signIn("ada");
    await saveMovie(ada, dune);

    expect(await isMovieSaved(ada, dune.id)).toBe(true);
    expect(await isMovieSaved(ada, arrival.id)).toBe(false);
});

test("lists the Saved list newest first and counts it", async () => {
    const ada = signIn("ada");
    await saveMovie(ada, dune);
    await saveMovie(ada, arrival);

    expect((await listSavedMovies(ada)).map(({ title }) => title)).toEqual(["Arrival", "Dune"]);
    expect(await countSavedMovies(ada)).toBe(2);
});

test("lists the whole Saved list, however many pages Appwrite splits it into", async () => {
    const ada = signIn("ada");
    const many = Array.from({ length: 130 }, (_, index) => movie({ id: index + 1, title: `Movie ${index + 1}` }));
    for (const each of many) await saveMovie(ada, each);

    const listed = await listSavedMovies(ada);

    expect(listed).toHaveLength(130);
    expect(listed[0].title).toBe("Movie 130");
    expect(listed[129].title).toBe("Movie 1");
    expect(await countSavedMovies(ada)).toBe(130);
});

test("reports a failure to save, unsave, or check", async () => {
    const ada = signIn("ada");

    fakeBackend.failNext("createDocument", new Error("Network request failed"));
    await expect(saveMovie(ada, dune)).rejects.toThrow("Network request failed");

    fakeBackend.failNext("deleteDocument", new AppwriteException("Server error", 500));
    await expect(unsaveMovie(ada, dune.id)).rejects.toThrow("Server error");

    fakeBackend.failNext("getDocument", new Error("Network request failed"));
    await expect(isMovieSaved(ada, dune.id)).rejects.toThrow("Network request failed");
});
