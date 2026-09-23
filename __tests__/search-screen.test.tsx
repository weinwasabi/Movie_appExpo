import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import SearchScreen from "@/app/(tabs)/search";
import useMovieSearch from "@/services/useMovieSearch";

jest.mock("expo-router", () => ({
    Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/services/useMovieSearch", () => jest.fn());
// the real adapters build an Appwrite client at import; the mocked hook never calls them
jest.mock("@/services/movieSearchAdapters", () => ({ movieSearchAdapters: {} }));

const mockUseMovieSearch = useMovieSearch as jest.MockedFunction<typeof useMovieSearch>;

// only the fields MovieCard reads
const movie = (id: number, title: string) =>
    ({ id, title, poster_path: "", vote_average: 8, release_date: "2021-10-22" }) as Movie;
const dune = movie(1, "Dune");

// FlatList wraps each row of cards in a flex-row View styled by columnWrapperStyle
// (the card's own TouchableOpacity also carries an opacity, so match the row itself)
const rowOpacity = (title: string) => {
    for (let node = screen.getByText(title).parent; node; node = node.parent) {
        const style = StyleSheet.flatten(node.props.style);
        if (style?.flexDirection === "row" && "opacity" in style) return style.opacity;
    }
    throw new Error(`no row around "${title}"`);
};

test("labels the previous results with their query while a new query loads", async () => {
    mockUseMovieSearch.mockReturnValue({ movies: [dune], resultsFor: "dune", status: "loading", error: null });

    await render(<SearchScreen />);

    expect(screen.getByText(/Search Result for/)).toBeTruthy();
    expect(screen.getByText("dune")).toBeTruthy();
    expect(rowOpacity("Dune")).toBe(0.5);
});

test("shows fresh results labelled and at full strength", async () => {
    mockUseMovieSearch.mockReturnValue({ movies: [dune], resultsFor: "dune", status: "success", error: null });

    await render(<SearchScreen />);

    expect(screen.getByText("dune")).toBeTruthy();
    expect(rowOpacity("Dune")).toBe(1);
});

test("shows no results heading before anything has been found", async () => {
    mockUseMovieSearch.mockReturnValue({ movies: [], resultsFor: null, status: "loading", error: null });

    await render(<SearchScreen />);

    expect(screen.queryByText(/Search Result for/)).toBeNull();
});
