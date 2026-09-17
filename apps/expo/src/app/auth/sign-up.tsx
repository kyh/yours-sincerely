import { Linking, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Text } from "@/components/ui/text";
import { resolveNextRoute } from "@/lib/next-route";
import { siteConfig } from "@/lib/site-config";

const SignUpScreen = () => {
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();

  return (
    <AuthScreen>
      <View className="mt-2">
        <AuthForm type="signup" next={resolveNextRoute(next)} />
      </View>
      <Text className="text-muted-foreground px-8 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <Text
          accessibilityRole="link"
          className="underline"
          onPress={async () => {
            try {
              await Linking.openURL(`${siteConfig.url}/terms`);
            } catch {
              toast.error("Could not open Terms of Service. Please try again.");
            }
          }}
        >
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text
          accessibilityRole="link"
          className="underline"
          onPress={async () => {
            try {
              await Linking.openURL(`${siteConfig.url}/privacy`);
            } catch {
              toast.error("Could not open Privacy Policy. Please try again.");
            }
          }}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </AuthScreen>
  );
};

export default SignUpScreen;
