import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { signInWithPasswordInput, signUpInput } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useReleasePushIdentity } from "@/components/notifications/push-notification-registration";
import { queryClient, trpc } from "@/lib/api";

/** Port of the web auth-form — email + password sign in/up. The session
    cookie from the response is captured by the fetch wrapper. */
type Props = {
  type: "signin" | "signup";
  /** Where to land after a successful sign-in/sign-up. Mirrors the web
      form's `nextPath` redirect target. */
  next?: Href;
};

type FieldErrors = Partial<Record<"email" | "password", string>>;

const showMutationError = (mutationError: { message: string }) =>
  toast.error(mutationError.message);

export const AuthForm = ({ type, next = "/" }: Props) => {
  const router = useRouter();
  const releasePushIdentity = useReleasePushIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const onSuccess = async () => {
    if (type === "signin") await releasePushIdentity();
    queryClient.clear();
    router.replace(next);
  };
  const signIn = useMutation(
    trpc.auth.signInWithPassword.mutationOptions({ onSuccess, onError: showMutationError }),
  );
  const signUp = useMutation(
    trpc.auth.signUp.mutationOptions({ onSuccess, onError: showMutationError }),
  );

  const handleSubmit = () => {
    const schema = type === "signup" ? signUpInput : signInWithPasswordInput;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" && errors.email === undefined) errors.email = issue.message;
        else if (field === "password" && errors.password === undefined)
          errors.password = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    if (type === "signup") signUp.mutate(parsed.data);
    else signIn.mutate(parsed.data);
  };

  return (
    <View className="gap-5">
      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-sm font-medium">Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {fieldErrors.email !== undefined && (
            <Text className="text-destructive text-xs">{fieldErrors.email}</Text>
          )}
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium">Password</Text>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="******"
            autoCapitalize="none"
            autoComplete={type === "signup" ? "new-password" : "current-password"}
            secureTextEntry
          />
          {fieldErrors.password !== undefined && (
            <Text className="text-destructive text-xs">{fieldErrors.password}</Text>
          )}
        </View>
      </View>
      <Button onPress={handleSubmit} loading={signIn.isPending || signUp.isPending}>
        {type === "signin" ? "Login" : "Sign Up"}
      </Button>
    </View>
  );
};
