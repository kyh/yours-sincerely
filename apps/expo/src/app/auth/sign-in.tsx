import { View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "@/lib/css-interop";

import { AuthForm } from "@/components/auth/auth-form";
import { BackButton } from "@/components/layout/back-button";
import { Text } from "@/components/ui/text";
import { resolveNextRoute } from "@/lib/next-route";

export default function SignInScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="px-5 py-3">
        <BackButton fallback="/" label="Back" />
      </View>
      <View className="flex-1 justify-center gap-6 px-6">
        <Text className="text-center text-2xl font-bold">Welcome back</Text>
        <AuthForm type="signin" next={resolveNextRoute(next)} />
        <View className="items-center gap-2">
          <Link href="/auth/sign-up">
            <Text className="text-muted-foreground text-sm">
              Don't have an account? <Text className="text-primary text-sm underline">Sign up</Text>
            </Text>
          </Link>
          <Link href="/auth/password-reset">
            <Text className="text-muted-foreground text-sm underline">Forgot your password?</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
