// callers can rely on .message whatever was thrown
export const toError = (err: unknown): Error => {
    if (err instanceof Error) return err;
    if (typeof err === "string" && err) return new Error(err);
    return new Error("An error occurred");
};
