import { useState } from "react";
import { AccountFormScreen, EmailField, FormLink, FormProblem, PasswordField, SubmitButton, useAccountForm } from "@/components/AccountForm";
import { useSession } from "@/services/session";

const SignIn = () => {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, submitting, problem, switchTo } = useAccountForm(() => signIn({ email: email.trim(), password }));

  return (
    <AccountFormScreen title="Sign in">
      <EmailField value={email} onChangeText={setEmail} />
      <PasswordField
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
      />

      <FormProblem problem={problem} />

      <SubmitButton label="Sign in" submitting={submitting} onPress={submit} />

      <FormLink label="Create account" disabled={submitting} onPress={() => switchTo("/sign-up")} />
    </AccountFormScreen>
  );
};

export default SignIn;
