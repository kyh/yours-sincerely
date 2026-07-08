import { Linking, Pressable, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { AuthForm } from "@/components/auth/auth-form";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { siteConfig } from "@/lib/site-config";

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useThemeColors();

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
        <Text className="text-center text-2xl font-bold">Create your account</Text>
        <AuthForm type="signup" />
        <Text className="text-muted-foreground px-8 text-center text-xs">
          By clicking continue, you agree to our{" "}
          <Text
            accessibilityRole="link"
            className="underline"
            onPress={() => {
              Linking.openURL(`${siteConfig.url}/terms`).catch(() => undefined);
            }}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            accessibilityRole="link"
            className="underline"
            onPress={() => {
              Linking.openURL(`${siteConfig.url}/privacy`).catch(() => undefined);
            }}
          >
            Privacy Policy
          </Text>
          .
        </Text>
        <View className="items-center">
          <Link href="/auth/sign-in">
            <Text className="text-muted-foreground text-sm">
              Already have an account? <Text className="text-primary text-sm underline">Login</Text>
            </Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
