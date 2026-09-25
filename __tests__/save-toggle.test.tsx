import { renderRouter, screen, fireEvent } from "expo-router/testing-library";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import MovieDetailsScreen from "@/app/movie/[id]";
import { fetchMovieDetails } from "@/services/api";
import { saveMovie } from "@/services/savedMovies";
import { fakeBackend } from "@/test-support/fakeAppwrite";
import { dune, saveToggle, savedIds, settledSaveToggle, stub } from "@/test-support/movieScreens";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

jest.mock("@/services/api", () => ({
    fetchMovieDetails: jest.fn(),
}));

const mockFetchMovieDetails = fetchMovieDetails as jest.MockedFunction<typeof fetchMovieDetails>;

const openDune = async () => {
    await renderRouter(
        {
            _layout: RootLayout,
            "(tabs)/_layout": TabsLayout,
            "(tabs)/index": stub("Home screen"),
            "(tabs)/search": stub("Search screen"),
            "(tabs)/save": stub("Saved screen"),
            "(tabs)/profile": stub("Profile screen"),
            "movie/[id]": MovieDetailsScreen,
            "sign-up": stub("Sign up screen"),
            "sign-in": stub("Sign in screen"),
        },
        { initialUrl: "/movie/438631" }
    );
    await screen.findByText("Dune");
};

const signedInMember = () =>
    fakeBackend.addMember({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical", signedIn: true });

beforeEach(() => mockFetchMovieDetails.mockResolvedValue(dune));
afterEach(() => fakeBackend.reset());

test("a Member saves the movie they're looking at", async () => {
    signedInMember();
    await openDune();
    expect(await settledSaveToggle()).not.toBeSelected();

    await fireEvent.press(saveToggle());

    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("a movie saved earlier, on this device or another, shows as saved when opened", async () => {
    const { $id } = signedInMember();
    await saveMovie($id, dune);

    await openDune();

    expect(await settledSaveToggle()).toBeSelected();
});

test("tapping a saved movie's Save toggle unsaves it", async () => {
    signedInMember();
    await openDune();
    await fireEvent.press(await settledSaveToggle());
    await settledSaveToggle();

    await fireEvent.press(saveToggle());

    expect(await settledSaveToggle()).not.toBeSelected();
    expect(savedIds()).toEqual([]);
});

test("the Save toggle fills the moment it's tapped, before Appwrite answers", async () => {
    signedInMember();
    await openDune();
    await settledSaveToggle();
    const answer = fakeBackend.holdNext("createDocument");

    await fireEvent.press(saveToggle());

    expect(saveToggle()).toBeSelected();
    expect(savedIds()).toEqual([]);

    answer();
    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("a failed save turns the Save toggle back and says so", async () => {
    signedInMember();
    await openDune();
    await settledSaveToggle();
    fakeBackend.failNext("createDocument", new Error("Network request failed"));

    await fireEvent.press(saveToggle());

    expect(await screen.findByText("Couldn't save this movie. Try again.")).toBeTruthy();
    expect(await settledSaveToggle()).not.toBeSelected();
    expect(savedIds()).toEqual([]);
});

test("a failed unsave turns the Save toggle back to saved and says so", async () => {
    signedInMember();
    await openDune();
    await fireEvent.press(await settledSaveToggle());
    await settledSaveToggle();
    fakeBackend.failNext("deleteDocument", new Error("Network request failed"));

    await fireEvent.press(saveToggle());

    expect(await screen.findByText("Couldn't remove this movie. Try again.")).toBeTruthy();
    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("a Guest sees the Save toggle outlined, and tapping it opens sign-in without saving", async () => {
    await openDune();
    expect(await screen.findByRole("button", { name: "Save", selected: false })).toBeTruthy();

    await fireEvent.press(saveToggle());

    expect(await screen.findByText("Sign in screen")).toBeTruthy();
    expect(fakeBackend.documents).toEqual([]);
});

test("a double tap while the save is on its way leaves one Saved Movie, still saved", async () => {
    signedInMember();
    await openDune();
    await settledSaveToggle();
    const answer = fakeBackend.holdNext("createDocument");

    await fireEvent.press(saveToggle());
    await fireEvent.press(saveToggle());
    answer();

    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("when Appwrite can't say whether the movie is saved, the Save toggle says so and can't be tapped", async () => {
    signedInMember();
    fakeBackend.failNext("getDocument", new Error("Network request failed"));

    await openDune();

    expect(await screen.findByText("Couldn't check whether this movie is saved.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save", disabled: true })).toBeTruthy();
});

test("a Member's Save toggle can't be tapped until the app knows they're signed in", async () => {
    let answer!: () => void;
    fakeBackend.currentAccountGate = new Promise((resolve) => (answer = resolve));
    signedInMember();
    await openDune();

    await fireEvent.press(saveToggle());

    expect(screen.queryByText("Sign in screen")).toBeNull();
    answer();
    expect(await settledSaveToggle()).not.toBeSelected();
});
