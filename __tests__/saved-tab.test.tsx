import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { renderRouter, screen, within, fireEvent, act, waitFor } from "expo-router/testing-library";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import SavedScreen from "@/app/(tabs)/save";
import ProfileScreen from "@/app/(tabs)/profile";
import { saveMovie } from "@/services/savedMovies";
import { fakeBackend } from "@/test-support/fakeAppwrite";
import { stub } from "@/test-support/movieScreens";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

// only the fields a Saved Movie snapshot reads
const movie = (id: number, title: string, release_date: string, vote_average: number) =>
    ({ id, title, release_date, vote_average, poster_path: `/${id}.jpg` }) as unknown as MovieDetails;

const dune = movie(438631, "Dune", "2021-09-15", 7.8);
const arrival = movie(329865, "Arrival", "2016-11-10", 7.6);

const MovieStub = () => <Text>Movie {useLocalSearchParams().id}</Text>;

const openSaved = () =>
    renderRouter(
        {
            _layout: RootLayout,
            "(tabs)/_layout": TabsLayout,
            "(tabs)/index": stub("Home screen"),
            "(tabs)/search": stub("Search screen"),
            "(tabs)/save": SavedScreen,
            "(tabs)/profile": ProfileScreen,
            "movie/[id]": MovieStub,
            "sign-up": stub("Sign up screen"),
            "sign-in": stub("Sign in screen"),
        },
        { initialUrl: "/save" }
    );

const signedInMember = () =>
    fakeBackend.addMember({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical", signedIn: true });

afterEach(() => fakeBackend.reset());

test("a Member sees their Saved Movies newest first, with title, year, and rating", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await saveMovie($id, arrival);

    await openSaved();

    const titles = await screen.findAllByText(/^(Arrival|Dune)$/);
    expect(titles.map((title) => title.props.children)).toEqual(["Arrival", "Dune"]);
    const duneCard = screen.getByRole("link", { name: /Dune/ });
    expect(within(duneCard).getByText("2021")).toBeTruthy();
    // TMDB's 7.8 out of 10, shown out of 5 like every other movie card
    expect(within(duneCard).getByText("4")).toBeTruthy();
});

test("tapping a Saved Movie opens its details page", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await openSaved();

    await fireEvent.press(await screen.findByRole("link", { name: /Dune/ }));

    expect(await screen.findByText("Movie 438631")).toBeTruthy();
});

test("a Member with nothing saved is pointed back to browsing", async () => {
    signedInMember();
    await openSaved();

    expect(await screen.findByText("No saved movies yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Browse movies" }));

    expect(await screen.findByText("Home screen")).toBeTruthy();
});

test("a Guest is invited to sign in or create an account to save movies", async () => {
    await openSaved();

    expect(await screen.findByText("Sign in to save movies")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Sign in screen")).toBeTruthy();
});

test("a Guest can go straight to creating an account from the Saved tab", async () => {
    await openSaved();

    await fireEvent.press(await screen.findByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Sign up screen")).toBeTruthy();
});

test("the Saved tab shows a spinner, not the Guest prompt, until it knows who is signed in", async () => {
    signedInMember();
    let answer!: () => void;
    fakeBackend.currentAccountGate = new Promise((resolve) => (answer = resolve));

    await openSaved();

    expect(screen.getByTestId("saved-loading")).toBeTruthy();
    expect(screen.queryByText("Sign in to save movies")).toBeNull();
    answer();
    expect(await screen.findByText("No saved movies yet")).toBeTruthy();
});

test("the Saved tab shows a spinner while the Saved list loads", async () => {
    signedInMember();
    const answer = fakeBackend.holdNext("listDocuments");

    await openSaved();

    expect(await screen.findByTestId("saved-loading")).toBeTruthy();
    expect(screen.queryByText("No saved movies yet")).toBeNull();
    answer();
    expect(await screen.findByText("No saved movies yet")).toBeTruthy();
});

test("a movie saved elsewhere shows up when the Member comes back to the Saved tab", async () => {
    const { $id } = signedInMember();
    await openSaved();
    await screen.findByText("No saved movies yet");

    await act(() => router.navigate("/"));
    await screen.findByText("Home screen");
    await saveMovie($id, dune);
    await act(() => router.navigate("/save"));

    expect(await screen.findByText("Dune")).toBeTruthy();
});

test("pulling to refresh picks up saves made on another device", async () => {
    const { $id } = signedInMember();
    await openSaved();
    await screen.findByText("No saved movies yet");
    await saveMovie($id, dune);

    await fireEvent(screen.getByTestId("saved-list"), "refresh");

    expect(await screen.findByText("Dune")).toBeTruthy();
});

test("when the Saved list can't load, the tab says so and pulling to refresh tries again", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    fakeBackend.failNext("listDocuments", new Error("Network request failed"));

    await openSaved();

    expect(await screen.findByText("Couldn't load your saved movies. Pull to try again.")).toBeTruthy();
    expect(screen.queryByText("No saved movies yet")).toBeNull();

    await fireEvent(screen.getByTestId("saved-list"), "refresh");

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(screen.queryByText("Couldn't load your saved movies. Pull to try again.")).toBeNull();
});

const savedIds = () => fakeBackend.documents.map((document) => document.movie_id);

test("long-pressing a Saved Movie and choosing Remove from Saved removes it straight away", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await saveMovie($id, arrival);
    await openSaved();

    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));

    await waitFor(() => expect(screen.queryByText("Dune")).toBeNull());
    expect(screen.getByText("Arrival")).toBeTruthy();
    expect(savedIds()).toEqual([arrival.id]);
});

test("the Member can back out of the long-press menu without removing anything", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await openSaved();

    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("button", { name: "Remove from Saved" })).toBeNull();
    expect(screen.getByText("Dune")).toBeTruthy();
    expect(savedIds()).toEqual([dune.id]);
});

test("the Saved Movie leaves the list before Appwrite answers", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await openSaved();
    const answer = fakeBackend.holdNext("deleteDocument");

    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));

    expect(await screen.findByText("No saved movies yet")).toBeTruthy();
    answer();
    await waitFor(() => expect(savedIds()).toEqual([]));
});

test("a failed removal puts the Saved Movie back and says so", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await saveMovie($id, arrival);
    await openSaved();
    fakeBackend.failNext("deleteDocument", new Error("Network request failed"));

    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));

    expect(await screen.findByText("Couldn't remove Dune. Try again.")).toBeTruthy();
    const titles = screen.getAllByText(/^(Arrival|Dune)$/);
    expect(titles.map((title) => title.props.children)).toEqual(["Arrival", "Dune"]);
    expect(savedIds()).toEqual([dune.id, arrival.id]);
});

test("Profile shows how many movies the Member has saved", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await saveMovie($id, arrival);
    await openSaved();

    await act(() => router.navigate("/profile"));

    expect(await screen.findByText("2 saved movies")).toBeTruthy();
});

test("Profile's count says 1 saved movie, and catches up after a removal on the Saved tab", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await saveMovie($id, arrival);
    await openSaved();
    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));
    await waitFor(() => expect(savedIds()).toEqual([arrival.id]));

    await act(() => router.navigate("/profile"));

    expect(await screen.findByText("1 saved movie")).toBeTruthy();
});

test("after signing out, the Saved tab shows the Guest prompt instead of the list", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await openSaved();
    await screen.findByText("Dune");

    await act(() => router.navigate("/profile"));
    await fireEvent.press(await screen.findByRole("button", { name: "Sign out" }));
    await act(() => router.navigate("/save"));

    expect(await screen.findByText("Sign in to save movies")).toBeTruthy();
    expect(screen.queryByText("Dune")).toBeNull();
});

test("a refresh that lands while a removal is on its way doesn't bring the Saved Movie back", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await saveMovie($id, arrival);
    await openSaved();
    const answer = fakeBackend.holdNext("deleteDocument");

    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));
    await fireEvent(screen.getByTestId("saved-list"), "refresh");

    expect(screen.queryByText("Dune")).toBeNull();
    answer();
    await waitFor(() => expect(savedIds()).toEqual([arrival.id]));
    expect(screen.queryByText("Dune")).toBeNull();
});

test("a removal that fails after a refresh landed puts the Saved Movie back once", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await openSaved();
    const answer = fakeBackend.holdNext("deleteDocument");
    fakeBackend.failNext("deleteDocument", new Error("Network request failed"));

    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));
    await fireEvent(screen.getByTestId("saved-list"), "refresh");
    answer();

    expect(await screen.findByText("Couldn't remove Dune. Try again.")).toBeTruthy();
    expect(screen.getAllByText("Dune")).toHaveLength(1);
});

test("a removal error clears once the Member refreshes the Saved list", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);
    await openSaved();
    fakeBackend.failNext("deleteDocument", new Error("Network request failed"));
    await fireEvent(await screen.findByRole("link", { name: /Dune/ }), "longPress");
    await fireEvent.press(screen.getByRole("button", { name: "Remove from Saved" }));
    await screen.findByText("Couldn't remove Dune. Try again.");

    await fireEvent(screen.getByTestId("saved-list"), "refresh");

    await waitFor(() => expect(screen.queryByText("Couldn't remove Dune. Try again.")).toBeNull());
    expect(screen.getByText("Dune")).toBeTruthy();
});
