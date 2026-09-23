import { AppwriteException } from "react-native-appwrite";
import { updateSearchCount } from "@/services/appwrite";

// the module builds its Databases at import, before this file's consts exist, so the fake
// lives inside the mock factory
jest.mock("react-native-appwrite", () => {
    const actual = jest.requireActual("react-native-appwrite");
    const fakeDatabase = {
        listDocuments: jest.fn(),
        createDocument: jest.fn(),
        incrementDocumentAttribute: jest.fn(),
        updateDocument: jest.fn(),
    };
    return {
        ...actual,
        Client: jest.fn(() => ({ setEndpoint() { return this; }, setProject() { return this; } })),
        Databases: jest.fn(() => fakeDatabase),
        fakeDatabase,
    };
});

const mockDatabase = jest.requireMock("react-native-appwrite").fakeDatabase as Record<
    "listDocuments" | "createDocument" | "incrementDocumentAttribute" | "updateDocument",
    jest.Mock
>;

const dune = { id: 438631, title: "Dune", poster_path: "/dune.jpg" } as Movie;

const noRowYet = () => mockDatabase.listDocuments.mockResolvedValue({ documents: [] });
const created = () => mockDatabase.createDocument.mock.calls[0][0];
const createdId = () => created().documentId;

afterEach(() => jest.resetAllMocks());

test("increments an existing term's count on the server, not by read-then-write", async () => {
    mockDatabase.listDocuments.mockResolvedValue({ documents: [{ $id: "row1", count: 7 }] });

    await updateSearchCount("dune", dune);

    expect(mockDatabase.incrementDocumentAttribute).toHaveBeenCalledWith(
        expect.objectContaining({ documentId: "row1", attribute: "count", value: 1 })
    );
    expect(mockDatabase.updateDocument).not.toHaveBeenCalled();
    expect(mockDatabase.createDocument).not.toHaveBeenCalled();
});

test("creates a first row for a new term with a count of 1", async () => {
    noRowYet();

    await updateSearchCount("dune", dune);

    expect(created().data).toEqual({
        searchTerm: "dune",
        movie_id: 438631,
        title: "Dune",
        count: 1,
        poster_url: "https://image.tmdb.org/t/p/w500/dune.jpg",
    });
    expect(mockDatabase.incrementDocumentAttribute).not.toHaveBeenCalled();
});

test("gives a term the same valid row id every time, so concurrent first searches collide", async () => {
    noRowYet();
    await updateSearchCount("dune part two: the long title of an extremely long search", dune);
    const first = createdId();

    jest.clearAllMocks();
    noRowYet();
    await updateSearchCount("dune part two: the long title of an extremely long search", dune);

    expect(createdId()).toBe(first);
    // Appwrite ids: a-z A-Z 0-9 . - _, no leading special char, at most 36 chars
    expect(first).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/);
});

test("gives different terms different row ids", async () => {
    noRowYet();
    await updateSearchCount("dune", dune);
    const duneId = createdId();

    jest.clearAllMocks();
    noRowYet();
    await updateSearchCount("dunes", dune);

    expect(createdId()).not.toBe(duneId);
});

const conflict = () =>
    new AppwriteException("Document with the requested ID already exists.", 409, "document_already_exists");

test("increments the row another search just created instead of losing the count", async () => {
    mockDatabase.listDocuments
        .mockResolvedValueOnce({ documents: [] })
        .mockResolvedValueOnce({ documents: [{ $id: "created-by-other-search" }] });
    mockDatabase.createDocument.mockRejectedValue(conflict());

    await updateSearchCount("dune", dune);

    expect(mockDatabase.incrementDocumentAttribute).toHaveBeenCalledWith(
        expect.objectContaining({ documentId: "created-by-other-search", attribute: "count", value: 1 })
    );
});

test("reports the conflict when no row for the term can be found after it", async () => {
    noRowYet();
    mockDatabase.createDocument.mockRejectedValue(conflict());

    await expect(updateSearchCount("dune", dune)).rejects.toThrow("already exists");
    expect(mockDatabase.incrementDocumentAttribute).not.toHaveBeenCalled();
});

test("reports any other failure to create the row", async () => {
    noRowYet();
    mockDatabase.createDocument.mockRejectedValue(new AppwriteException("Unauthorized", 401));

    await expect(updateSearchCount("dune", dune)).rejects.toThrow("Unauthorized");
    expect(mockDatabase.incrementDocumentAttribute).not.toHaveBeenCalled();
});
