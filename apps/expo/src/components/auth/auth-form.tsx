import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { signInWithPasswordInput, signUpInput } from "@repo/api/auth/auth-schema";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { queryClient, trpc } from "@/lib/api";

/** Port of the web auth-form — email + password sign in/up. The session
    cookie from the response is captured by the fetch wrapper. */
type Props = {
  type: "signin" | "signup";
};

export const AuthForm = ({ type }: Props) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSuccess = () => {
    queryClient.clear();
    router.replace("/");
  };
  const onError = (mutationError: { message: string }) => toast.error(mutationError.message);

  const signIn = useMutation(trpc.auth.signInWithPassword.mutationOptions({ onSuccess, onError }));
  const signUp = useMutation(trpc.auth.signUp.mutationOptions({ onSuccess, onError }));

  const handleSubmit = () => {
    const schema = type === "signup" ? signUpInput : signInWithPasswordInput;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }
    setError(null);
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
        </View>
        {error !== null && <Text className="text-destructive text-xs">{error}</Text>}
      </View>
      <Button onPress={handleSubmit} loading={signIn.isPending || signUp.isPending}>
        {type === "signin" ? "Login" : "Sign Up"}
      </Button>
    </View>
  );
};
