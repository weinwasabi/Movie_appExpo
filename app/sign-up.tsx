import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import colors from "@/constants/colors";
import { AccountFormError, MIN_PASSWORD_LENGTH, useSession } from "@/services/session";

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

const Field = ({ label, ...inputProps }: FieldProps) => (
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

const SignUp = () => {
  const { signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<AccountFormError | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setProblem(null);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      router.back();
    } catch (err) {
      setProblem(err as AccountFormError);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-5 pb-10 gap-5" keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => router.back()} className="self-start py-3">
            <Text className="text-light-200 text-base">Back</Text>
          </Pressable>

          <Text className="text-white font-bold text-2xl">Create account</Text>

          <Field label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <View className="gap-2">
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <View className="flex-row justify-between items-center">
              <Text className="text-light-200 text-xs">At least {MIN_PASSWORD_LENGTH} characters</Text>
              <Pressable accessibilityRole="button" onPress={() => setShowPassword((shown) => !shown)} className="py-1">
                <Text className="text-light-100 text-sm">{showPassword ? "Hide password" : "Show password"}</Text>
              </Pressable>
            </View>
          </View>

          {problem && (
            <View accessibilityRole="alert" className="gap-1">
              <Text className="text-red-400 text-sm">{problem.message}</Text>
              {problem.reason === "email-taken" && (
                <Pressable accessibilityRole="link" onPress={() => router.replace("/sign-in")} className="self-start py-1">
                  <Text className="text-light-100 font-semibold text-sm">Sign in instead</Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            disabled={submitting}
            onPress={submit}
            className="bg-accent rounded-lg py-3.5 items-center"
          >
            {submitting ? (
              <ActivityIndicator color={colors.light[100]} />
            ) : (
              <Text className="text-white font-semibold text-base">Create account</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
