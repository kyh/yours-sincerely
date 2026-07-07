import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { requestPasswordResetInput } from "@repo/api/auth/auth-schema";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "@/lib/css-interop";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { trpc } from "@/lib/api";

export default function PasswordResetScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requestReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
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
        <Pressable
          accessibilityRole="button"
          className="active:bg-accent -ml-2 h-8 w-16 flex-row items-center gap-1 rounded-lg px-2"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/auth/sign-in");
          }}
        >
          <ArrowLeft size={16} color={colors.foreground} />
          <Text className="text-sm font-medium">Back</Text>
        </Pressable>
      </View>
      <View className="flex-1 justify-center gap-6 px-6">
        <Text className="text-center text-2xl font-bold">Reset your password</Text>
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
      </View>
    </SafeAreaView>
  );
}
