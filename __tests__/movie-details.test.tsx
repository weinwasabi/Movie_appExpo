import { render, screen } from "@testing-library/react-native";
import MovieDetailsScreen from "@/app/movie/[id]";
import { fetchMovieDetails } from "@/services/api";
import colors from "@/constants/colors";
import { SessionProvider } from "@/services/session";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

jest.mock("expo-router", () => ({
    router: { back: jest.fn() },
    useLocalSearchParams: () => ({ id: "550" }),
}));

jest.mock("@/services/api", () => ({
    fetchMovieDetails: jest.fn(),
}));

const mockFetchMovieDetails = fetchMovieDetails as jest.MockedFunction<typeof fetchMovieDetails>;

// the details header's Save toggle reads who is signed in
const renderMovieDetails = () =>
    render(
        <SessionProvider>
            <MovieDetailsScreen />
        </SessionProvider>
    );

test("shows a spinner while the movie is loading", async () => {
    mockFetchMovieDetails.mockReturnValue(new Promise(() => {}));

    await renderMovieDetails();

    // the accent colour must be a prop: react-native-web ignores NativeWind's text-* mapping
    expect(screen.getByTestId("movie-details-loading").props.color).toBe(colors.accent);
    expect(screen.queryByText("Overview")).toBeNull();
});

test("shows the error message and a way back when the movie fails to load", async () => {
    mockFetchMovieDetails.mockRejectedValue(new Error("Failed to fetch movie details"));

    await renderMovieDetails();

    expect(await screen.findByText("Failed to fetch movie details")).toBeTruthy();
    expect(screen.getByText("Go Back")).toBeTruthy();
    expect(screen.queryByText("Overview")).toBeNull();
});

// only the fields the screen reads; the rest of MovieDetails is irrelevant here
const movieWith = (overrides: Partial<MovieDetails>) =>
    ({
        title: "Fight Club",
        release_date: "1999-10-15",
        runtime: 139,
        vote_average: 8.4,
        vote_count: 27000,
        overview: "An insomniac office worker...",
        genres: [],
        budget: 63_000_000,
        revenue: 100_853_753,
        production_companies: [],
        poster_path: null,
        ...overrides,
    }) as MovieDetails;

test("leaves out the poster when the movie has none", async () => {
    mockFetchMovieDetails.mockResolvedValue(movieWith({ poster_path: null }));

    await renderMovieDetails();

    expect(await screen.findByText("Fight Club")).toBeTruthy();
    expect(screen.queryByTestId("movie-poster")).toBeNull();
});

test("shows the poster once the movie has one", async () => {
    mockFetchMovieDetails.mockResolvedValue(movieWith({ poster_path: "/poster.jpg" }));

    await renderMovieDetails();

    expect((await screen.findByTestId("movie-poster")).props.source).toEqual({
        uri: "https://image.tmdb.org/t/p/w500/poster.jpg",
    });
});
