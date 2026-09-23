import { fetchMovies } from "@/services/api";

const respondWith = (response: Partial<Response>) =>
    jest.spyOn(global, "fetch").mockResolvedValue(response as Response);

afterEach(() => jest.restoreAllMocks());

test("returns the movies TMDB found", async () => {
    const dune = { id: 1, title: "Dune" };
    respondWith({ ok: true, json: async () => ({ results: [dune] }) });

    await expect(fetchMovies({ query: "dune" })).resolves.toEqual([dune]);
});

test("returns no movies when TMDB sends no results", async () => {
    respondWith({ ok: true, json: async () => ({}) });

    await expect(fetchMovies({ query: "dune" })).resolves.toEqual([]);
});

test("reports the HTTP status when TMDB fails", async () => {
    respondWith({ ok: false, status: 401, statusText: "Unauthorized" });

    await expect(fetchMovies({ query: "dune" })).rejects.toThrow(
        "Failed to fetch movies: 401 Unauthorized"
    );
});
