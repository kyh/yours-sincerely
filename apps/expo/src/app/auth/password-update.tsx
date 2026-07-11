import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { setPasswordInput } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "@/lib/css-interop";
import { toast } from "sonner-native";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { queryClient, trpc } from "@/lib/api";

/** Mirrors the web SetPasswordForm's client-side confirm-password check;
    the token/password shape sent to the mutation still comes from
    setPasswordInput. */
const setPasswordFormInput = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

/** Deep-link target: yourssincerely://auth/password-update?token=... */
export default function PasswordUpdateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tokenParam = params.token;
  const token = typeof tokenParam === "string" ? tokenParam : undefined;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (token === undefined) router.replace("/auth/password-reset");
  }, [token, router]);

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
    if (token === undefined) return;

    const parsed = setPasswordFormInput.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "password" && errors.password === undefined) errors.password = issue.message;
        else if (field === "confirmPassword" && errors.confirmPassword === undefined)
          errors.confirmPassword = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    const payload = setPasswordInput.safeParse({ token, password: parsed.data.password });
    if (!payload.success) {
      setFieldErrors({ password: payload.error.issues[0]?.message ?? "Invalid password" });
      return;
    }

    setFieldErrors({});
    setPasswordMutation.mutate(payload.data);
  };

  if (token === undefined) return null;

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 justify-center gap-6 px-6">
        <Text className="text-center text-2xl font-bold">Set a new password</Text>
        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-sm font-medium">New Password</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="******"
              autoCapitalize="none"
              autoComplete="new-password"
              secureTextEntry
            />
            {fieldErrors.password !== undefined && (
              <Text className="text-destructive text-xs">{fieldErrors.password}</Text>
            )}
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium">Confirm Password</Text>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="******"
              autoCapitalize="none"
              autoComplete="new-password"
              secureTextEntry
            />
            {fieldErrors.confirmPassword !== undefined && (
              <Text className="text-destructive text-xs">{fieldErrors.confirmPassword}</Text>
            )}
          </View>
        </View>
        <Button onPress={handleSubmit} loading={setPasswordMutation.isPending}>
          Set Password
        </Button>
      </View>
    </SafeAreaView>
  );
}
