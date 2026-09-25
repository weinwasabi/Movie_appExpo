import { ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import colors from "@/constants/colors";
import { AccountFormError } from "@/services/session";
import { usePendingSave } from "@/services/pendingSave";

// The pieces the sign-in and sign-up screens share, so the two forms look and behave alike

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

export const Field = ({ label, ...inputProps }: FieldProps) => (
  <View className="gap-2">
    <Text className="text-light-200 text-sm">{label}</Text>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.light[200]}
      className="bg-dark-200 rounded-lg px-4 py-3.5 text-white"
      {...inputProps}
    />
  </View>
);

export const EmailField = (inputProps: Omit<FieldProps, "label">) => (
  <Field
    label="Email"
    autoCapitalize="none"
    autoComplete="email"
    keyboardType="email-address"
    textContentType="emailAddress"
    {...inputProps}
  />
);

type PasswordFieldProps = Omit<FieldProps, "label" | "secureTextEntry"> & { hint?: string };

export const PasswordField = ({ hint, ...inputProps }: PasswordFieldProps) => {
  const [shown, setShown] = useState(false);

  return (
    <View className="gap-2">
      <Field label="Password" secureTextEntry={!shown} autoCapitalize="none" {...inputProps} />
      <View className="flex-row justify-between items-center">
        <Text className="text-light-200 text-xs">{hint}</Text>
        <Pressable accessibilityRole="button" onPress={() => setShown((wasShown) => !wasShown)} className="py-1">
          <Text className="text-light-100 text-sm">{shown ? "Hide password" : "Show password"}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const FormLink = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="link" onPress={onPress} className="self-start py-1">
    <Text className="text-light-100 font-semibold text-sm">{label}</Text>
  </Pressable>
);

// the form's problem in words, plus whatever way out fits it (e.g. "Sign in instead")
export const FormProblem = ({ problem, children }: { problem: AccountFormError | null; children?: ReactNode }) =>
  problem && (
    <View accessibilityRole="alert" className="gap-1">
      <Text className="text-red-400 text-sm">{problem.message}</Text>
      {children}
    </View>
  );

export const SubmitButton = ({ label, submitting, onPress }: { label: string; submitting: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled: submitting }}
    disabled={submitting}
    onPress={onPress}
    className="bg-accent rounded-lg py-3.5 items-center"
  >
    {submitting ? (
      <ActivityIndicator color={colors.light[100]} />
    ) : (
      <Text className="text-white font-semibold text-base">{label}</Text>
    )}
  </Pressable>
);

// a titled, scrollable form screen with a Back button that leaves without changing anything
export const AccountFormScreen = ({ title, children }: { title: string; children: ReactNode }) => (
  <SafeAreaView className="bg-primary flex-1">
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView contentContainerClassName="px-5 pb-10 gap-5" keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} className="self-start py-3">
          <Text className="text-light-200 text-base">Back</Text>
        </Pressable>

        <Text accessibilityRole="header" className="text-white font-bold text-2xl">{title}</Text>

        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

// Submit's busy flag and inline problem, shared by both forms. On success it returns to where
// the form was opened from: back, or, with nothing to go back to, the movie a Guest was saving
// (or home). A submit that lands after the form was closed goes nowhere. switchTo opens the
// other form in this one's place, passing on any save.
export const useAccountForm = (submitAccountDetails: () => Promise<void>) => {
  const pendingSave = usePendingSave();
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<AccountFormError | null>(null);
  const open = useRef(true);

  useEffect(() => {
    open.current = true;
    return () => {
      open.current = false;
    };
  }, []);

  const submitAndReturn = async () => {
    setSubmitting(true);
    setProblem(null);
    pendingSave.hold();
    try {
      await submitAccountDetails();
    } catch (err) {
      pendingSave.drop();
      if (!open.current) return;
      setProblem(err as AccountFormError);
      setSubmitting(false);
      return;
    }
    // closed while signing in: the save was dropped with the form, and the person has moved on
    if (!open.current) return;
    pendingSave.handOff();
    if (router.canGoBack()) router.back();
    else router.replace(pendingSave.movieHref ?? "/");
  };

  // the form's onPress, returning nothing: nothing should wait on the whole sign-in
  const submit = () => void submitAndReturn();

  // replace, so backing out of either form returns to wherever the first was opened from
  const switchTo = (pathname: "/sign-in" | "/sign-up") => router.replace({ pathname, params: pendingSave.params });

  return { submit, submitting, problem, switchTo };
};
