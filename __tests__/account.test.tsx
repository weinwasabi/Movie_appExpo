import { Text } from "react-native";
import { renderRouter, screen, fireEvent } from "expo-router/testing-library";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import ProfileScreen from "@/app/(tabs)/profile";
import SignUpScreen from "@/app/sign-up";
import SignInScreen from "@/app/sign-in";
import { fakeBackend } from "@/test-support/fakeAppwrite";

jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());

// Profile's neighbours only need to exist so the tabs and stack can mount
const stub = (label: string) => () => <Text>{label}</Text>;

const openProfile = () =>
    renderRouter(
        {
            _layout: RootLayout,
            "(tabs)/_layout": TabsLayout,
            "(tabs)/index": stub("Home screen"),
            "(tabs)/search": stub("Search screen"),
            "(tabs)/save": stub("Saved screen"),
            "(tabs)/profile": ProfileScreen,
            "movie/[id]": stub("Movie screen"),
            "sign-up": SignUpScreen,
            "sign-in": SignInScreen,
        },
        { initialUrl: "/profile" }
    );

afterEach(() => fakeBackend.reset());

test("a Guest's Profile invites them to sign in or create an account", async () => {
    await openProfile();

    expect(await screen.findByRole("button", { name: "Create account" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
});

const fillSignUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    await fireEvent.changeText(screen.getByLabelText("Name"), name);
    await fireEvent.changeText(screen.getByLabelText("Email"), email);
    await fireEvent.changeText(screen.getByLabelText("Password"), password);
    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
};

test("a Guest creates an account from Profile and lands back on Profile as a Member", async () => {
    await openProfile();
    await fireEvent.press(await screen.findByRole("button", { name: "Create account" }));

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });

    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(fakeBackend.accounts.map(({ email }) => email)).toEqual(["ada@example.com"]);
});

test("a Member who signed in last time is still signed in when the app starts", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol", signedIn: true });

    await openProfile();

    expect(await screen.findByText("Grace Hopper")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create account" })).toBeNull();
});

test("an expired session comes back as a Guest", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol" });
    fakeBackend.failNext("get", new (jest.requireActual("react-native-appwrite").AppwriteException)("Session expired", 401));

    await openProfile();

    expect(await screen.findByRole("button", { name: "Create account" })).toBeTruthy();
});

test("Profile shows a spinner, not the Guest prompt, until it knows who is signed in", async () => {
    let answer!: () => void;
    fakeBackend.currentAccountGate = new Promise((resolve) => (answer = resolve));
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol", signedIn: true });

    await openProfile();

    expect(screen.getByTestId("profile-loading")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create account" })).toBeNull();

    answer();
    expect(await screen.findByText("Grace Hopper")).toBeTruthy();
});

test("signing out turns Profile back into the Guest prompt", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol", signedIn: true });
    await openProfile();

    await fireEvent.press(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("button", { name: "Create account" })).toBeTruthy();
    expect(screen.queryByText("Grace Hopper")).toBeNull();
    expect(fakeBackend.sessionAccountId).toBeNull();
});

const openSignUp = async () => {
    await openProfile();
    await fireEvent.press(await screen.findByRole("button", { name: "Create account" }));
};

test("a password shorter than 8 characters is refused before any account is made", async () => {
    await openSignUp();

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "short" });

    expect(await screen.findByText("Password must be at least 8 characters")).toBeTruthy();
    expect(fakeBackend.accounts).toEqual([]);
});

test("an email that already has an account offers to sign in instead", async () => {
    fakeBackend.addMember({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });
    await openSignUp();

    await fillSignUp({ name: "Ada Again", email: "ada@example.com", password: "differentpw" });

    expect(await screen.findByText("An account with this email already exists")).toBeTruthy();
    await fireEvent.press(screen.getByRole("link", { name: "Sign in instead" }));
    expect(await screen.findByRole("header", { name: "Sign in" })).toBeTruthy();
});

test("any other sign-up failure is shown on the form, keeping what was typed", async () => {
    await openSignUp();
    fakeBackend.failNext("create", new Error("Network request failed"));

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });

    expect(await screen.findByText("Network request failed")).toBeTruthy();
    expect(screen.getByLabelText("Email").props.value).toBe("ada@example.com");
});

test("backing out of sign-up leaves Profile as it was", async () => {
    await openSignUp();
    await fireEvent.changeText(screen.getByLabelText("Email"), "ada@example.com");

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByRole("button", { name: "Create account" })).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(fakeBackend.accounts).toEqual([]);
});

test("the password can be shown and hidden again while typing it", async () => {
    await openSignUp();
    const password = () => screen.getByLabelText("Password");
    expect(password().props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Show password" }));
    expect(password().props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Hide password" }));
    expect(password().props.secureTextEntry).toBe(true);
});

test("signing out still turns Profile back into the Guest prompt when Appwrite can't be reached", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol", signedIn: true });
    await openProfile();
    await screen.findByText("Grace Hopper");
    fakeBackend.failNext("deleteSession", new Error("Network request failed"));

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("button", { name: "Create account" })).toBeTruthy();
});

test("trying again after the account was made but the sign-in step failed signs the Member in", async () => {
    await openSignUp();
    fakeBackend.failNext("createEmailPasswordSession", new Error("Network request failed"));

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });
    expect(await screen.findByText("Network request failed")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
    expect(fakeBackend.accounts).toHaveLength(1);
});

test("trying again after signing in worked but loading the Member failed carries on with that session", async () => {
    await openSignUp();
    fakeBackend.failNext("get", new Error("Network request failed"));

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });
    expect(await screen.findByText("Network request failed")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
});

const openSignIn = async () => {
    await openProfile();
    await fireEvent.press(await screen.findByRole("button", { name: "Sign in" }));
    await screen.findByRole("header", { name: "Sign in" });
};

const fillSignIn = async ({ email, password }: { email: string; password: string }) => {
    await fireEvent.changeText(screen.getByLabelText("Email"), email);
    await fireEvent.changeText(screen.getByLabelText("Password"), password);
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
};

test("a Guest with an account signs in from Profile and lands back on Profile as a Member", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol" });
    await openSignIn();

    await fillSignIn({ email: "grace@example.com", password: "cobolcobol" });

    expect(await screen.findByText("Grace Hopper")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(fakeBackend.sessionAccountId).toBe(fakeBackend.accounts[0].$id);
});

test("a wrong password and an unknown email get the same message", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol" });
    await openSignIn();

    await fillSignIn({ email: "grace@example.com", password: "wrongpassword" });
    expect(await screen.findByText("Email or password is incorrect")).toBeTruthy();

    await fillSignIn({ email: "nobody@example.com", password: "cobolcobol" });
    expect(await screen.findByText("Email or password is incorrect")).toBeTruthy();
    expect(fakeBackend.sessionAccountId).toBeNull();
});

test("any other sign-in failure is shown on the form, keeping what was typed", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol" });
    await openSignIn();
    fakeBackend.failNext("createEmailPasswordSession", new Error("Network request failed"));

    await fillSignIn({ email: "grace@example.com", password: "cobolcobol" });

    expect(await screen.findByText("Network request failed")).toBeTruthy();
    expect(screen.getByLabelText("Email").props.value).toBe("grace@example.com");
});

test("backing out of sign-in leaves Profile as it was", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol" });
    await openSignIn();
    await fireEvent.changeText(screen.getByLabelText("Email"), "grace@example.com");

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByRole("button", { name: "Create account" })).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(fakeBackend.sessionAccountId).toBeNull();
});

test("sign-in links to sign-up, and backing out of sign-up returns to Profile", async () => {
    await openSignIn();

    await fireEvent.press(screen.getByRole("link", { name: "Create account" }));
    expect(await screen.findByRole("header", { name: "Create account" })).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
});

test("the sign-in password can be shown and hidden", async () => {
    await openSignIn();
    const password = () => screen.getByLabelText("Password");
    expect(password().props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Show password" }));
    expect(password().props.secureTextEntry).toBe(false);
});

test("signing in replaces a session this device couldn't confirm at start", async () => {
    // an old session is still on the device, but checking it failed, so the app started as a Guest
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol", signedIn: true });
    fakeBackend.addMember({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });
    fakeBackend.failNext("get", new Error("Network request failed"));
    await openSignIn();

    await fillSignIn({ email: "ada@example.com", password: "analytical" });

    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
    expect(screen.queryByText("Grace Hopper")).toBeNull();
});

test("creating an account replaces a session this device couldn't confirm at start", async () => {
    fakeBackend.addMember({ name: "Grace Hopper", email: "grace@example.com", password: "cobolcobol", signedIn: true });
    fakeBackend.failNext("get", new Error("Network request failed"));
    await openSignUp();

    await fillSignUp({ name: "Ada Lovelace", email: "ada@example.com", password: "analytical" });

    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
    expect(screen.queryByText("Grace Hopper")).toBeNull();
});
