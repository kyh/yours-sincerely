import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { setPasswordInput } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/components/auth/auth-screen";
import { useReleasePushIdentity } from "@/components/notifications/push-notification-registration";
import { FormField } from "@/components/auth/form-field";
import { queryClient, orpc } from "@/lib/api";

/** Mirrors the web SetPasswordForm's client-side confirm-password check;
    the token/password shape sent to the mutation still comes from
    setPasswordInput. */
const setPasswordFormInput = z
  .object({
    confirmPassword: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;
const resetToken = z.string().min(1);

const getFieldErrors = (password: string, confirmPassword: string): FieldErrors => {
  const parsed = setPasswordFormInput.safeParse({ confirmPassword, password });
  const errors: FieldErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [field] = issue.path;
      if (field === "password" && errors.password === undefined) {
        errors.password = issue.message;
      } else if (field === "confirmPassword" && errors.confirmPassword === undefined) {
        errors.confirmPassword = issue.message;
      }
    }
  }
  return errors;
};

/** Deep-link target: yourssincerely://auth/password-update?token=... */
const PasswordUpdateScreen = () => {
  const router = useRouter();
  const releasePushIdentity = useReleasePushIdentity();
  const params = useLocalSearchParams();
  const tokenParam = resetToken.safeParse(params.token);
  const token = tokenParam.success ? tokenParam.data : undefined;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const passwordInput = useRef<TextInput>(null);
  const confirmPasswordInput = useRef<TextInput>(null);

  useEffect(() => {
    if (token === undefined) {
      router.replace("/auth/password-reset");
    }
  }, [token, router]);

  const setPasswordMutation = useMutation(
    orpc.auth.setPassword.mutationOptions({
      onError: (mutationError) => toast.error(mutationError.message),
      onSuccess: async () => {
        await releasePushIdentity();
        toast.success("Password updated");
        queryClient.clear();
        router.replace("/");
      },
    }),
  );

  const handleSubmit = () => {
    if (token === undefined || setPasswordMutation.isPending) {
      return;
    }
    setSubmitted(true);
    const errors = getFieldErrors(password, confirmPassword);
    setFieldErrors(errors);
    if (errors.password !== undefined) {
      passwordInput.current?.focus();
      return;
    }
    if (errors.confirmPassword !== undefined) {
      confirmPasswordInput.current?.focus();
      return;
    }

    const payload = setPasswordInput.safeParse({ password, token });
    if (!payload.success) {
      setFieldErrors({ password: payload.error.issues[0]?.message ?? "Invalid password" });
      return;
    }

    setFieldErrors({});
    setPasswordMutation.mutate(payload.data);
  };

  if (token === undefined) {
    return null;
  }

  return (
    <AuthScreen>
      <View>
        <FormField
          inputRef={passwordInput}
          label="New Password"
          error={fieldErrors.password}
          position="first"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (submitted) {
              setFieldErrors(getFieldErrors(value, confirmPassword));
            }
          }}
          placeholder="******"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmPasswordInput.current?.focus()}
          secureTextEntry
        />
        <FormField
          inputRef={confirmPasswordInput}
          label="Confirm Password"
          error={fieldErrors.confirmPassword}
          position="last"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (submitted) {
              setFieldErrors(getFieldErrors(password, value));
            }
          }}
          placeholder="******"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          secureTextEntry
        />
      </View>
      <Button onPress={handleSubmit} loading={setPasswordMutation.isPending}>
        Set Password
      </Button>
    </AuthScreen>
  );
};

export default PasswordUpdateScreen;
