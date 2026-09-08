import { Linking, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "@/lib/css-interop";

import { AuthForm } from "@/components/auth/auth-form";
import { BackButton } from "@/components/layout/back-button";
import { Text } from "@/components/ui/text";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { siteConfig } from "@/lib/site-config";

const SignUpScreen = () => (
  <SafeAreaView className="bg-background flex-1">
    <View className="px-5 py-3">
      <BackButton fallback="/" label="Back" />
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
            void ignoreRejection(Linking.openURL(`${siteConfig.url}/terms`));
          }}
        >
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text
          accessibilityRole="link"
          className="underline"
          onPress={() => {
            void ignoreRejection(Linking.openURL(`${siteConfig.url}/privacy`));
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

export default SignUpScreen;
