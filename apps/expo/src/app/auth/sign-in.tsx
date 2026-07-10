import { Pressable, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { AuthForm } from "@/components/auth/auth-form";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";

/** Only known, parameterless routes are accepted as a post-signin
    destination — keeps the redirect typed without an `as` cast. */
const resolveNextRoute = (value: string | string[] | undefined): Href => {
  if (typeof value !== "string") return "/";
  switch (value) {
    case "/":
    case "/settings":
    case "/notifications":
    case "/profile":
      return value;
    default:
      return "/";
  }
};

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { next } = useLocalSearchParams<{ next?: string }>();

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="px-5 py-3">
        <Pressable
          accessibilityRole="button"
          className="active:bg-accent -ml-2 h-8 w-16 flex-row items-center gap-1 rounded-lg px-2"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <ArrowLeft size={16} color={colors.foreground} />
          <Text className="text-sm font-medium">Back</Text>
        </Pressable>
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
