import { act, renderRouter, screen, fireEvent } from "expo-router/testing-library";
import { router } from "expo-router";
import * as rootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import ProfileScreen from "@/app/(tabs)/profile";
import MovieDetailsScreen from "@/app/movie/[id]";
import SignUpScreen from "@/app/sign-up";
import SignInScreen from "@/app/sign-in";
import { fetchMovieDetails } from "@/services/api";
import { saveMovie } from "@/services/savedMovies";
import { fakeBackend } from "@/test-support/fakeAppwrite";
import { dune, saveToggle, savedIds, settledSaveToggle, stub } from "@/test-support/movieScreens";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

jest.mock("@/services/api", () => ({
    fetchMovieDetails: jest.fn(),
}));

const mockFetchMovieDetails = fetchMovieDetails as jest.MockedFunction<typeof fetchMovieDetails>;

const openApp = (initialUrl: string) =>
    renderRouter(
        {
            // the whole module, so its unstable_settings apply as they do in the app
            _layout: rootLayout,
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

// Dune opened from Profile, so there's a screen under it to go back to
const openDuneFromProfile = async () => {
    await openApp("/profile");
    await screen.findByRole("button", { name: "Create account" });
    await act(() => router.push("/movie/438631"));
    await screen.findByText("Dune");
};

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

// lets everything already on its way (fake Appwrite calls, the renders they cause) finish;
// renderRouter fakes timers, and advancing them asynchronously yields to the real event loop
const settle = () => act(() => jest.advanceTimersByTimeAsync(0));

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
    await openDuneFromProfile();
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

test("a sign-in opened for a save with nothing to go back to opens the movie, saved", async () => {
    fakeBackend.addMember(grace);
    await openApp("/sign-in?saveMovieId=438631");
    await screen.findByRole("header", { name: "Sign in" });

    await fillSignIn(grace);

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);

    await fireEvent.press(screen.getByText("Go Back"));
    expect(await screen.findByText("Home screen")).toBeTruthy();
});

test("a sign-in opened for a save over another screen still lands on the movie, saved", async () => {
    fakeBackend.addMember(grace);
    await openApp("/");
    await screen.findByText("Home screen");
    await act(() => router.push("/sign-in?saveMovieId=438631"));
    await screen.findByRole("header", { name: "Sign in" });

    await fillSignIn(grace);

    expect(await screen.findByText("Dune")).toBeTruthy();
    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("the other form can't be opened while signing in is on its way", async () => {
    fakeBackend.addMember(grace);
    await openDune();
    await tapSaveAsGuest();
    const releaseSignIn = fakeBackend.holdNext("createEmailPasswordSession");
    await fillSignIn(grace);

    await fireEvent.press(screen.getByRole("link", { name: "Create account" }));
    expect(screen.getByRole("header", { name: "Sign in" })).toBeTruthy();
    releaseSignIn();

    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("a sign-in abandoned by backing out can't undo the save of a later one that worked", async () => {
    fakeBackend.addMember(grace);
    await openDuneFromProfile();
    await tapSaveAsGuest();
    const releaseAbandonedSignIn = fakeBackend.holdNext("createEmailPasswordSession");
    await fillSignIn(grace);
    await pressBack();
    await screen.findByText("Dune");

    // try again; hold the movie's saved check so the abandoned sign-in fails before it answers
    const releaseCheck = fakeBackend.holdNext("getDocument");
    await tapSaveAsGuest();
    await fillSignIn(grace);
    await screen.findByText("Dune");
    fakeBackend.failNext("createEmailPasswordSession", new Error("Network request failed"));
    releaseAbandonedSignIn();
    await settle();
    releaseCheck();

    expect(await settledSaveToggle()).toBeSelected();
    expect(savedIds()).toEqual([438631]);
});

test("a sign-in abandoned by backing out that lands later doesn't take a newer sign-in's save", async () => {
    fakeBackend.addMember(grace);
    const ada = fakeBackend.addMember({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });
    await openDuneFromProfile();
    await tapSaveAsGuest();
    const releaseAbandonedSignIn = fakeBackend.holdNext("createEmailPasswordSession");
    await fillSignIn(grace);
    await pressBack();
    await screen.findByText("Dune");

    // someone else signs in to save it; Grace's abandoned sign-in lands while theirs is on its way
    await tapSaveAsGuest();
    const releaseSignIn = fakeBackend.holdNext("createEmailPasswordSession");
    await fillSignIn(ada);
    releaseAbandonedSignIn();
    await settle();
    releaseSignIn();

    expect(await settledSaveToggle()).toBeSelected();
    expect(fakeBackend.documents).toEqual([expect.objectContaining({ movie_id: 438631, member_id: ada.$id })]);
});

test("a sign-in opened by a deep link without a save goes home", async () => {
    fakeBackend.addMember(grace);
    await openApp("/sign-in");
    await screen.findByRole("header", { name: "Sign in" });

    await fillSignIn(grace);

    expect(await screen.findByText("Home screen")).toBeTruthy();
});

test("backing out while sign-in is on its way stays on the movie and saves nothing", async () => {
    fakeBackend.addMember(grace);
    await openDuneFromProfile();
    await tapSaveAsGuest();
    const releaseSignIn = fakeBackend.holdNext("createEmailPasswordSession");
    await fillSignIn(grace);

    await pressBack();
    await screen.findByText("Dune");
    releaseSignIn();

    // the sign-in still lands, but doesn't take the person anywhere: they're still on Dune
    await fireEvent.press(await screen.findByText("Go Back"));
    expect(await screen.findByText("Grace Hopper")).toBeTruthy();
    await act(() => router.push("/movie/438631"));
    expect(await settledSaveToggle()).not.toBeSelected();
    expect(fakeBackend.documents).toEqual([]);
});

test("a save still waiting when its Member signs out isn't made for whoever signs in next", async () => {
    fakeBackend.addMember(grace);
    fakeBackend.addMember({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });
    // the movie can't be loaded after signing in, so nothing takes the save
    mockFetchMovieDetails.mockRejectedValueOnce(new Error("Network request failed"));
    await openApp("/sign-in?saveMovieId=438631");
    await screen.findByRole("header", { name: "Sign in" });
    await fillSignIn(grace);
    expect(await screen.findByText("Network request failed")).toBeTruthy();

    await act(() => router.push("/profile"));
    await fireEvent.press(await screen.findByRole("button", { name: "Sign out" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Sign in" }));
    await fillSignIn({ email: "ada@example.com", password: "analytical" });
    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
    await act(() => router.push("/movie/438631"));

    expect(await settledSaveToggle()).not.toBeSelected();
    expect(fakeBackend.documents).toEqual([]);
});
