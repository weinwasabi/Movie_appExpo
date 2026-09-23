// callers can rely on .message whatever was thrown
export const toError = (err: unknown): Error =>
    err instanceof Error ? err : new Error("An error occurred");
