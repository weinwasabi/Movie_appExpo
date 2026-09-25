import { Text } from "react-native";
import { act, renderRouter, screen, fireEvent } from "expo-router/testing-library";
import { router } from "expo-router";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import ProfileScreen from "@/app/(tabs)/profile";
import MovieDetailsScreen from "@/app/movie/[id]";
import SignUpScreen from "@/app/sign-up";
import SignInScreen from "@/app/sign-in";
import { fetchMovieDetails } from "@/services/api";
import { saveMovie } from "@/services/savedMovies";
import { fakeBackend } from "@/test-support/fakeAppwrite";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

jest.mock("@/services/api", () => ({
    fetchMovieDetails: jest.fn(),
}));

const mockFetchMovieDetails = fetchMovieDetails as jest.MockedFunction<typeof fetchMovieDetails>;

// only the fields the screen and a Saved Movie read; the rest of MovieDetails is irrelevant here
const dune = {
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

const stub = (label: string) => () => <Text>{label}</Text>;

const openApp = (initialUrl: string) =>
    renderRouter(
        {
            _layout: RootLayout,
            "(tabs)/_layout": TabsLayout,
            "(tabs)/index": stub("Home screen"),
            "(tabs)/search": stub("Search screen"),
            "(tabs)/save": stub("Saved screen"),
            "(tabs)/profile": ProfileScreen,
            "movie/[id]": MovieDetailsScreen,
            "sign-up": SignUpScreen,
            "sign-in": SignInScreen,
        },
        { initialUrl }
    );

const openDune = async () => {
    await openApp("/movie/438631");
    await screen.findByText("Dune");
};

const saveToggle = () => screen.getByRole("button", { name: "Save" });
// the Save toggle once it's ready to tap: its saved state is known and no change is in flight
const settledSaveToggle = () => screen.findByRole("button", { name: "Save", disabled: false, busy: false });
const savedIds = () => fakeBackend.documents.map((document) => document.movie_id);
const grace = { name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol" };

const tapSaveAsGuest = async () => {
    await fireEvent.press(await settledSaveToggle());
    await screen.findByRole("header", { name: "Sign in" });
};

const fillSignIn = async ({ email, password }: { email: string; password: string }) => {
    await fireEvent.changeText(screen.getByLabelText("Email"), email);
    await fireEvent.changeText(screen.getByLabelText("Password"), password);
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
};

const fillSignUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    await fireEvent.changeText(screen.getByLabelText("Name"), name);
    await fireEvent.changeText(screen.getByLabelText("Email"), email);
    await fireEvent.changeText(screen.getByLabelText("Password"), password);
    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
};

const pressBack = () => fireEvent.press(screen.getByRole("button", { name: "Back" }));

beforeEach(() => mockFetchMovieDetails.mockResolvedValue(dune));
afterEach(() => fakeBackend.reset());

test("a Guest who taps Save and signs in lands back on the movie with it saved", async () => {
    const { $id } = fakeBackend.addMember(grace);
    await openDune();
    await tapSaveAsGuest();

    await fillSignIn(grace);

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(await settledSaveToggle()).toBeSelected();
    expect(fakeBackend.documents).toEqual([expect.objectContaining({ movie_id: 438631, member_id: $id })]);
});

test("a Guest who taps Save and creates an account instead lands back on the movie with it saved", async () => {
    await openDune();
    await tapSaveAsGuest();
    await fireEvent.press(screen.getByRole("link", { name: "Create account" }));
    await screen.findByRole("header", { name: "Create account" });

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("taking \"Sign in instead\" from sign-up still finishes the save", async () => {
    fakeBackend.addMember(grace);
    await openDune();
    await tapSaveAsGuest();
    await fireEvent.press(screen.getByRole("link", { name: "Create account" }));
    await fillSignUp({ name: "Grace Again", email: grace.email, password: "differentpw" });
    await fireEvent.press(await screen.findByRole("link", { name: "Sign in instead" }));
    await screen.findByRole("header", { name: "Sign in" });

    await fillSignIn(grace);

    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("a movie the Member had already saved stays saved after signing in from Save", async () => {
    const { $id } = fakeBackend.addMember(grace);
    fakeBackend.sessionAccountId = $id;
    await saveMovie($id, dune);
    fakeBackend.sessionAccountId = null;
    await openDune();
    await tapSaveAsGuest();

    await fillSignIn(grace);

    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("backing out of sign-in returns to the movie with nothing saved", async () => {
    fakeBackend.addMember(grace);
    await openDune();
    await tapSaveAsGuest();
    await fireEvent.changeText(screen.getByLabelText("Email"), grace.email);

    await pressBack();

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(saveToggle()).not.toBeSelected();
    expect(fakeBackend.sessionAccountId).toBeNull();
    expect(fakeBackend.documents).toEqual([]);
});

test("backing out of sign-up, reached from sign-in, returns to the movie with nothing saved", async () => {
    await openDune();
    await tapSaveAsGuest();
    await fireEvent.press(screen.getByRole("link", { name: "Create account" }));
    await screen.findByRole("header", { name: "Create account" });

    await pressBack();

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(saveToggle()).not.toBeSelected();
    expect(fakeBackend.accounts).toEqual([]);
    expect(fakeBackend.documents).toEqual([]);
});

test("a failed sign-in then backing out drops the save, even if the Guest signs in later from Profile", async () => {
    fakeBackend.addMember(grace);
    await openApp("/profile");
    await screen.findByRole("button", { name: "Create account" });
    await act(() => router.push("/movie/438631"));
    await screen.findByText("Dune");
    await tapSaveAsGuest();
    fakeBackend.failNext("createEmailPasswordSession", new Error("Network request failed"));
    await fillSignIn(grace);
    expect(await screen.findByText("Network request failed")).toBeTruthy();
    await pressBack();
    await screen.findByText("Dune");

    await fireEvent.press(screen.getByText("Go Back"));
    await fireEvent.press(await screen.findByRole("button", { name: "Sign in" }));
    await fillSignIn(grace);
    expect(await screen.findByText("Grace Hopper")).toBeTruthy();
    await act(() => router.push("/movie/438631"));

    expect(await settledSaveToggle()).not.toBeSelected();
    expect(fakeBackend.documents).toEqual([]);
});

test("a sign-in opened for a save with no movie to return to saves nothing, then or later", async () => {
    fakeBackend.addMember(grace);
    await openApp("/sign-in?save=438631");
    await screen.findByRole("header", { name: "Sign in" });

    await fillSignIn(grace);
    await act(() => router.push("/movie/438631"));

    expect(await settledSaveToggle()).not.toBeSelected();
    expect(fakeBackend.documents).toEqual([]);
});
