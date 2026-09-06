import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { requestPasswordResetInput } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "@/lib/css-interop";
import { toast } from "sonner-native";

import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/api";

export default function PasswordResetScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requestReset = useMutation(
    orpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => toast.success("Password reset email sent"),
      onError: (mutationError) => toast.error(mutationError.message),
    }),
  );

  const handleSubmit = () => {
    const parsed = requestPasswordResetInput.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setError(null);
    requestReset.mutate(parsed.data);
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="px-5 py-3">
        <BackButton fallback="/auth/sign-in" label="Back" />
      </View>
      <View className="flex-1 justify-center gap-6 px-6">
        <Text className="text-center text-2xl font-bold">Reset your password</Text>
        {requestReset.isSuccess ? (
          <View className="gap-4">
            <View className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <Text className="text-center text-sm text-green-800 dark:text-green-200">
                Password reset email sent! Check your inbox and follow the instructions to reset
                your password.
              </Text>
            </View>
            <Button variant="outline" onPress={() => router.replace("/auth/sign-in")}>
              Back to sign in
            </Button>
          </View>
        ) : (
          <>
            <View className="gap-1">
              <Text className="text-sm font-medium">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              {error !== null && <Text className="text-destructive text-xs">{error}</Text>}
            </View>
            <Button onPress={handleSubmit} loading={requestReset.isPending}>
              Send reset email
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
