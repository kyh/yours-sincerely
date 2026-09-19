import { useRef, useState } from "react";
import { View } from "react-native";
import type { TextInput } from "react-native";
import { useRouter } from "expo-router";
import { requestPasswordResetInput } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/api";

const PasswordResetScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const emailInput = useRef<TextInput>(null);

  const requestReset = useMutation(
    orpc.auth.requestPasswordReset.mutationOptions({
      onError: (mutationError) => toast.error(mutationError.message),
      onSuccess: () => toast.success("Password reset email sent"),
    }),
  );

  const handleSubmit = () => {
    if (requestReset.isPending) {
      return;
    }
    setSubmitted(true);
    const parsed = requestPasswordResetInput.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      emailInput.current?.focus();
      return;
    }
    setError(null);
    requestReset.mutate(parsed.data);
  };

  return (
    <AuthScreen>
      {requestReset.isSuccess ? (
        <View className="gap-4">
          <View className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <Text className="text-center text-sm text-green-800 dark:text-green-200">
              Password reset email sent! Check your inbox and follow the instructions to reset your
              password.
            </Text>
          </View>
          <Button variant="outline" onPress={() => router.replace("/auth/sign-in")}>
            Back to sign in
          </Button>
        </View>
      ) : (
        <>
          <FormField
            inputRef={emailInput}
            label="Email"
            error={error ?? undefined}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (submitted) {
                const parsed = requestPasswordResetInput.shape.email.safeParse(value);
                setError(
                  parsed.success ? null : (parsed.error.issues[0]?.message ?? "Invalid email"),
                );
              }
            }}
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
          <Button onPress={handleSubmit} loading={requestReset.isPending}>
            Request Password Reset
          </Button>
        </>
      )}
    </AuthScreen>
  );
};

export default PasswordResetScreen;
