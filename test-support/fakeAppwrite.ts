// An in-memory stand-in for the Appwrite backend, used as the `react-native-appwrite` mock:
//   jest.mock("react-native-appwrite", () => require("@/test-support/fakeAppwrite").fakeAppwriteModule());
// Account behaves like Appwrite's (409 on a taken email, 401 on bad credentials or no session),
// and Databases like a collection with document-level security (each document visible only to
// the roles its permissions name), so tests describe people and outcomes instead of scripting
// each SDK call.

type StoredAccount = { $id: string; name: string; email: string; password: string };
type StoredDocument = { $id: string; $collectionId: string; $createdAt: string; $permissions: string[]; [field: string]: unknown };
type AccountMethod = "create" | "createEmailPasswordSession" | "get" | "deleteSession";
type DatabasesMethod = "createDocument" | "getDocument" | "deleteDocument" | "listDocuments";
type Method = AccountMethod | DatabasesMethod;

const { AppwriteException } = jest.requireActual("react-native-appwrite");

export const fakeBackend = {
    accounts: [] as StoredAccount[],
    // the account the device's session cookie belongs to, if any
    sessionAccountId: null as string | null,
    documents: [] as StoredDocument[],
    // the next call to each named method rejects with its error instead of running
    failures: {} as Partial<Record<Method, Error>>,
    // the next call to each named Databases method waits for its release before running
    holds: {} as Partial<Record<DatabasesMethod, Promise<void>>>,
    // Account.get waits on this before answering, so tests can observe the app before it knows
    currentAccountGate: null as Promise<void> | null,

    reset() {
        this.accounts = [];
        this.sessionAccountId = null;
        this.documents = [];
        this.failures = {};
        this.holds = {};
        this.currentAccountGate = null;
    },

    failNext(method: Method, error: Error) {
        this.failures[method] = error;
    },

    // holds the next call to a Databases method until the returned function is called
    holdNext(method: DatabasesMethod) {
        let release!: () => void;
        this.holds[method] = new Promise((resolve) => (release = resolve));
        return release;
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

const failIfScripted = (method: Method) => {
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

const waitIfHeld = async (method: DatabasesMethod) => {
    const hold = fakeBackend.holds[method];
    delete fakeBackend.holds[method];
    if (hold) await hold;
};

// the roles the device's session holds, as Appwrite's permission strings name them
const sessionRoles = () => ["any", ...(fakeBackend.sessionAccountId ? ["users", `user:${fakeBackend.sessionAccountId}`] : [])];

const allows = (document: StoredDocument, action: "read" | "update" | "delete") =>
    sessionRoles().some((role) => document.$permissions.includes(`${action}("${role}")`));

const notFound = () => new AppwriteException("Document with the requested ID could not be found.", 404, "document_not_found");

type Query = { method: string; attribute?: string; values?: unknown[] };

const applyQueries = (documents: StoredDocument[], queries: string[]) => {
    const parsed = queries.map((query) => JSON.parse(query) as Query);
    let limit = 25;
    let cursor: string | undefined;
    let matching = [...documents];
    for (const { method, attribute, values = [] } of parsed) {
        if (method === "equal") matching = matching.filter((document) => values.includes(document[attribute!]));
        else if (method === "orderDesc" || method === "orderAsc") {
            const direction = method === "orderDesc" ? -1 : 1;
            matching.sort((a, b) => (String(a[attribute!]) < String(b[attribute!]) ? -direction : direction));
        } else if (method === "limit") limit = values[0] as number;
        else if (method === "cursorAfter") cursor = values[0] as string;
        else throw new Error(`fakeAppwrite doesn't support Query.${method}`);
    }
    const total = matching.length;
    // cursors page through the filtered, ordered matches, as Appwrite's do
    if (cursor) matching = matching.slice(matching.findIndex((document) => document.$id === cursor) + 1);
    return { total, documents: matching.slice(0, limit) };
};

class FakeDatabases {
    async createDocument({ collectionId, documentId, data, permissions = [] }: {
        databaseId: string; collectionId: string; documentId: string; data: object; permissions?: string[];
    }) {
        await waitIfHeld("createDocument");
        failIfScripted("createDocument");
        // collection-level permission: any signed-in user may create
        if (!fakeBackend.sessionAccountId) {
            throw new AppwriteException("The current user is not authorized to perform the requested action.", 401, "user_unauthorized");
        }
        // Appwrite refuses permissions for roles the creator doesn't hold
        const foreignRole = permissions.find((permission) => !sessionRoles().some((role) => permission.endsWith(`("${role}")`)));
        if (foreignRole) {
            throw new AppwriteException(`Permissions must be one of: (${sessionRoles().join(", ")})`, 401, "user_unauthorized");
        }
        if (fakeBackend.documents.some((document) => document.$collectionId === collectionId && document.$id === documentId)) {
            throw new AppwriteException("Document with the requested ID already exists.", 409, "document_already_exists");
        }
        // strictly increasing, so newest-first ordering is well defined
        const $createdAt = new Date(Date.UTC(2026, 0, 1) + fakeBackend.documents.length * 1000).toISOString();
        const document = { ...data, $id: documentId, $collectionId: collectionId, $createdAt, $permissions: permissions };
        fakeBackend.documents.push(document);
        return document;
    }

    async getDocument({ collectionId, documentId }: { databaseId: string; collectionId: string; documentId: string }) {
        await waitIfHeld("getDocument");
        failIfScripted("getDocument");
        const document = fakeBackend.documents.find(
            (candidate) => candidate.$collectionId === collectionId && candidate.$id === documentId
        );
        if (!document || !allows(document, "read")) throw notFound();
        return document;
    }

    async deleteDocument({ collectionId, documentId }: { databaseId: string; collectionId: string; documentId: string }) {
        await waitIfHeld("deleteDocument");
        failIfScripted("deleteDocument");
        const document = fakeBackend.documents.find(
            (candidate) => candidate.$collectionId === collectionId && candidate.$id === documentId
        );
        if (!document || !allows(document, "read")) throw notFound();
        if (!allows(document, "delete")) {
            throw new AppwriteException("The current user is not authorized to perform the requested action.", 401, "user_unauthorized");
        }
        fakeBackend.documents = fakeBackend.documents.filter((candidate) => candidate !== document);
        return {};
    }

    async listDocuments({ collectionId, queries = [] }: { databaseId: string; collectionId: string; queries?: string[] }) {
        await waitIfHeld("listDocuments");
        failIfScripted("listDocuments");
        const readable = fakeBackend.documents.filter(
            (document) => document.$collectionId === collectionId && allows(document, "read")
        );
        return applyQueries(readable, queries);
    }
}

export const fakeAppwriteModule = () => {
    const actual = jest.requireActual("react-native-appwrite");
    return {
        ...actual,
        Client: jest.fn(() => ({ setEndpoint() { return this; }, setProject() { return this; } })),
        Account: jest.fn(() => new FakeAccount()),
        Databases: jest.fn(() => new FakeDatabases()),
    };
};
