import { toError } from "@/services/toError";

test("passes an Error through unchanged", () => {
    const error = new Error("Failed to fetch movies");

    expect(toError(error)).toBe(error);
});

test("keeps the message of a thrown string", () => {
    expect(toError("Network request failed").message).toBe("Network request failed");
});

test("falls back to a generic message for anything else", () => {
    expect(toError(undefined).message).toBe("An error occurred");
    expect(toError("").message).toBe("An error occurred");
    expect(toError({ code: 500 }).message).toBe("An error occurred");
});
