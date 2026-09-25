import { useState } from "react";
import { router } from "expo-router";
import { AccountFormScreen, Field, FormLink, FormProblem, PasswordField, SubmitButton, useAccountForm } from "@/components/AccountForm";
import { useSession } from "@/services/session";

const SignIn = () => {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, submitting, problem } = useAccountForm(() => signIn({ email: email.trim(), password }));

  return (
    <AccountFormScreen title="Sign in">
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <PasswordField
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
      />

      <FormProblem problem={problem} />

      <SubmitButton label="Sign in" submitting={submitting} onPress={submit} />

      {/* replace, so backing out of sign-up returns to wherever sign-in was opened from */}
      <FormLink label="Create account" onPress={() => router.replace("/sign-up")} />
    </AccountFormScreen>
  );
};

export default SignIn;
