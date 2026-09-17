import { Pressable, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { safeNextPath } from "@repo/contracts/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Text } from "@/components/ui/text";
import { resolveNextRoute } from "@/lib/next-route";

const SignInScreen = () => {
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const nextParam = safeNextPath(next);

  return (
    <AuthScreen>
      <View className="mt-2">
        <AuthForm type="signin" next={resolveNextRoute(next)} />
      </View>
      <View className="flex-row items-center justify-center gap-1">
        <Link href={{ params: { next: nextParam }, pathname: "/auth/sign-up" }} asChild>
          <Pressable
            accessibilityRole="link"
            className="min-h-11 min-w-11 items-center justify-center"
          >
            <Text className="text-muted-foreground text-xs underline">Sign up</Text>
          </Pressable>
        </Link>
        <Text className="text-muted-foreground text-xs">·</Text>
        <Link href="/auth/password-reset" asChild>
          <Pressable accessibilityRole="link" className="min-h-11 items-center justify-center">
            <Text className="text-muted-foreground text-xs underline">Forgot password?</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
};

export default SignInScreen;
