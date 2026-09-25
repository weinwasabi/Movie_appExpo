import { useState } from "react";
import { AccountFormScreen, EmailField, Field, FormLink, FormProblem, PasswordField, SubmitButton, useAccountForm } from "@/components/AccountForm";
import { MIN_PASSWORD_LENGTH, useSession } from "@/services/session";

const SignUp = () => {
  const { signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, submitting, problem, switchTo } = useAccountForm(() =>
    signUp({ name: name.trim(), email: email.trim(), password })
  );

  return (
    <AccountFormScreen title="Create account">
      <Field label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
      <EmailField value={email} onChangeText={setEmail} />
      <PasswordField
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <FormProblem problem={problem}>
        {problem?.reason === "email-taken" && (
          <FormLink label="Sign in instead" disabled={submitting} onPress={() => switchTo("/sign-in")} />
        )}
      </FormProblem>

      <SubmitButton label="Create account" submitting={submitting} onPress={submit} />
    </AccountFormScreen>
  );
};

export default SignUp;
