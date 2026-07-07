import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { setPasswordInput } from "@repo/api/auth/auth-schema";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "@/lib/css-interop";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { queryClient, trpc } from "@/lib/api";

/** Deep-link target: yourssincerely://auth/password-update?token=... */
export default function PasswordUpdateScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setPasswordMutation = useMutation(
    trpc.auth.setPassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password updated");
        queryClient.clear();
        router.replace("/");
      },
      onError: (mutationError) => toast.error(mutationError.message),
    }),
  );

  const handleSubmit = () => {
    const parsed = setPasswordInput.safeParse({ token: token ?? "", password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setError(null);
    setPasswordMutation.mutate(parsed.data);
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 justify-center gap-6 px-6">
        <Text className="text-center text-2xl font-bold">Set a new password</Text>
        <View className="gap-1">
          <Text className="text-sm font-medium">New password</Text>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="******"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
          />
          {error !== null && <Text className="text-destructive text-xs">{error}</Text>}
        </View>
        <Button onPress={handleSubmit} loading={setPasswordMutation.isPending}>
          Update password
        </Button>
      </View>
    </SafeAreaView>
  );
}
