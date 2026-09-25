// An in-memory stand-in for the Appwrite backend, used as the `react-native-appwrite` mock:
//   jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());
// Account behaves like Appwrite's (409 on a taken email, 401 on bad credentials or no session),
// so tests describe people and outcomes instead of scripting each SDK call.

type StoredAccount = { $id: string; name: string; email: string; password: string };
type AccountMethod = "create" | "createEmailPasswordSession" | "get" | "deleteSession";

const { AppwriteException } = jest.requireActual("react-native-appwrite");

export const fakeBackend = {
    accounts: [] as StoredAccount[],
    // the account the device's session cookie belongs to, if any
    sessionAccountId: null as string | null,
    // the next call to each named Account method rejects with its error instead of running
    failures: {} as Partial<Record<AccountMethod, Error>>,
    // Account.get waits on this before answering, so tests can observe the app before it knows
    currentAccountGate: null as Promise<void> | null,

    reset() {
        this.accounts = [];
        this.sessionAccountId = null;
        this.failures = {};
        this.currentAccountGate = null;
    },

    failNext(method: AccountMethod, error: Error) {
        this.failures[method] = error;
    },

    // a Member who already has an Account, optionally with a session left over from last time
    addMember({ name, email, password, signedIn = false }: { name: string; email: string; password: string; signedIn?: boolean }) {
        const account = { $id: `user_${this.accounts.length + 1}`, name, email, password };
        this.accounts.push(account);
        if (signedIn) this.sessionAccountId = account.$id;
        return account;
    },
};

const publicUser = ({ password: _password, ...user }: StoredAccount) => user;

const failIfScripted = (method: AccountMethod) => {
    const failure = fakeBackend.failures[method];
    delete fakeBackend.failures[method];
    if (failure) throw failure;
};

class FakeAccount {
    async create({ userId, email, password, name }: { userId: string; email: string; password: string; name?: string }) {
        failIfScripted("create");
        if (password.length < 8) {
            throw new AppwriteException("Invalid `password` param: Password must be between 8 and 256 characters long.", 400, "general_argument_invalid");
        }
        if (fakeBackend.accounts.some((account) => account.email === email)) {
            throw new AppwriteException("A user with the same id, email, or phone already exists in this project.", 409, "user_already_exists");
        }
        const account = { $id: userId, email, password, name: name ?? "" };
        fakeBackend.accounts.push(account);
        return publicUser(account);
    }

    async createEmailPasswordSession({ email, password }: { email: string; password: string }) {
        failIfScripted("createEmailPasswordSession");
        if (fakeBackend.sessionAccountId) {
            throw new AppwriteException("Creation of a session is prohibited when a session is active.", 401, "user_session_already_exists");
        }
        const account = fakeBackend.accounts.find((candidate) => candidate.email === email && candidate.password === password);
        if (!account) {
            throw new AppwriteException("Invalid credentials. Please check the email and password.", 401, "user_invalid_credentials");
        }
        fakeBackend.sessionAccountId = account.$id;
        return { $id: `session_${account.$id}`, userId: account.$id };
    }

    async get() {
        if (fakeBackend.currentAccountGate) await fakeBackend.currentAccountGate;
        failIfScripted("get");
        const account = fakeBackend.accounts.find((candidate) => candidate.$id === fakeBackend.sessionAccountId);
        if (!account) {
            throw new AppwriteException("User (role: guests) missing scopes ([\"account\"])", 401, "general_unauthorized_scope");
        }
        return publicUser(account);
    }

    async deleteSession(_params: { sessionId: string }) {
        failIfScripted("deleteSession");
        fakeBackend.sessionAccountId = null;
        return {};
    }
}

export const fakeAppwriteModule = () => {
    const actual = jest.requireActual("react-native-appwrite");
    return {
        ...actual,
        Client: jest.fn(() => ({ setEndpoint() { return this; }, setProject() { return this; } })),
        Account: jest.fn(() => new FakeAccount()),
        Databases: jest.fn(() => ({})),
    };
};
