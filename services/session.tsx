import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Account, ID } from "react-native-appwrite";
import { client, isAppwriteType } from "./appwriteClient";
import { toError } from "./toError";
import { dropPendingSave } from "./pendingSave";

const account = new Account(client);

export type Member = { id: string; name: string; email: string };

// "loading" until the app has asked Appwrite whether this device holds a session
export type Session =
    | { status: "loading" }
    | { status: "guest" }
    | { status: "member"; member: Member };

export type SignUpDetails = { name: string; email: string; password: string };

export type SignInDetails = { email: string; password: string };

export const MIN_PASSWORD_LENGTH = 8;

export type AccountFormReason = "email-taken" | "password-too-short" | "incorrect-credentials" | "other";

// What went wrong with an Account form, in words the form can show as-is
export class AccountFormError extends Error {
    constructor(message: string, readonly reason: AccountFormReason) {
        super(message);
    }
}

const toAccountFormError = (err: unknown): AccountFormError =>
    err instanceof AccountFormError ? err : new AccountFormError(toError(err).message, "other");

const fetchMember = async (): Promise<Member> => {
    const { $id, name, email } = await account.get();
    return { id: $id, name, email };
};

const currentMember = async (): Promise<Member | null> => {
    try {
        return await fetchMember();
    } catch {
        // no session, or an expired or revoked one: either way this device is a Guest
        return null;
    }
};

// Signs this device in. A session left open on it (one the app couldn't confirm at start, or
// from an earlier attempt) may be someone else's: end it so the new one belongs to whoever
// is signing in now.
const openSession = async (details: SignInDetails) => {
    try {
        await account.createEmailPasswordSession(details);
    } catch (err) {
        if (!isAppwriteType(err, "user_session_already_exists")) throw err;
        await account.deleteSession({ sessionId: "current" });
        await account.createEmailPasswordSession(details);
    }
};

type SessionValue = {
    session: Session;
    signUp: (details: SignUpDetails) => Promise<void>;
    signIn: (details: SignInDetails) => Promise<void>;
    signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session>({ status: "loading" });

    useEffect(() => {
        currentMember().then((member) => setSession(member ? { status: "member", member } : { status: "guest" }));
    }, []);

    const signUp = useCallback(async ({ name, email, password }: SignUpDetails) => {
        try {
            if (password.length < MIN_PASSWORD_LENGTH) {
                throw new AccountFormError(
                    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
                    "password-too-short"
                );
            }
            try {
                await account.create({ userId: ID.unique(), email, password, name });
            } catch (err) {
                // may be a retry after the Account was made but its session wasn't: if the
                // password matches, the session below signs them in; if not, the email is taken
                if (!isAppwriteType(err, "user_already_exists")) throw err;
            }
            try {
                await openSession({ email, password });
            } catch (err) {
                if (isAppwriteType(err, "user_invalid_credentials")) {
                    throw new AccountFormError("An account with this email already exists", "email-taken");
                }
                throw err;
            }
            setSession({ status: "member", member: await fetchMember() });
        } catch (err) {
            throw toAccountFormError(err);
        }
    }, []);

    const signIn = useCallback(async (details: SignInDetails) => {
        try {
            await openSession(details);
            setSession({ status: "member", member: await fetchMember() });
        } catch (err) {
            // one message for a wrong password and an unknown email, so the form doesn't
            // reveal which emails have Accounts
            if (isAppwriteType(err, "user_invalid_credentials")) {
                throw new AccountFormError("Email or password is incorrect", "incorrect-credentials");
            }
            throw toAccountFormError(err);
        }
    }, []);

    const signOut = useCallback(async () => {
        // leave the device as a Guest even if Appwrite can't be reached to end the session, with
        // no save left waiting to be made for whoever signs in next
        dropPendingSave();
        setSession({ status: "guest" });
        await account.deleteSession({ sessionId: "current" }).catch(() => {});
    }, []);

    const value = useMemo(() => ({ session, signUp, signIn, signOut }), [session, signUp, signIn, signOut]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
    const value = useContext(SessionContext);
    if (!value) throw new Error("useSession must be used inside SessionProvider");
    return value;
};
