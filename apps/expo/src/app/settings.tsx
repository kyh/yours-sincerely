import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "@/lib/css-interop";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { themes, useTheme } from "@/components/theme-provider";
import { useThemeColors } from "@/components/theme-colors";
import { deleteSessionCookie } from "@/lib/session-store";
import { queryClient, trpc } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Port of the web settings page: email (saved on blur), password reset,
    theme picker, sign out, legal links. */
export default function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { theme, setTheme } = useTheme();
  const { user } = useWorkspaceUser();

  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user?.email !== undefined && user.email !== null) setEmail(user.email);
  }, [user?.email]);

  const updateUser = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess: () => toast.success("Settings successfully updated"),
      onError: () => toast.error("Could not update Settings. Please try again."),
    }),
  );
  const requestPasswordReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => toast.success("Password reset email sent"),
      onError: () => toast.error("Could not send password reset email. Please try again."),
    }),
  );
  const signOut = useMutation(
    trpc.auth.signOut.mutationOptions({
      onSuccess: async () => {
        await deleteSessionCookie();
        queryClient.clear();
        router.replace("/");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const handleEmailBlur = () => {
    if (user === null || email === (user.email ?? "")) return;
    updateUser.mutate({ userId: user.id, email });
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-5 py-3">
        <Pressable
          accessibilityRole="button"
          className="active:bg-accent -ml-2 h-8 flex-row items-center gap-1 rounded-lg px-2"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <ArrowLeft size={16} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-bold">Settings</Text>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-5 pb-10">
        {user !== null && (
          <>
            <View className="gap-2">
              <Text className="text-sm font-medium">Email</Text>
              <Text className="text-muted-foreground text-xs">
                You will continue to be anonymous, this email is just used for account recovery.
              </Text>
              <Input
                value={email}
                onChangeText={setEmail}
                onBlur={handleEmailBlur}
                placeholder="Your email"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">Password</Text>
              <Button
                variant="secondary"
                onPress={() => {
                  if (user.email === null || user.email === "") {
                    toast.error("Add an email first");
                    return;
                  }
                  requestPasswordReset.mutate({ email: user.email });
                }}
                loading={requestPasswordReset.isPending}
              >
                Request password reset
              </Button>
            </View>
          </>
        )}

        <View className="gap-3">
          <Text className="text-sm font-medium">Appearance</Text>
          <View className="flex-row flex-wrap gap-4">
            {themes.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: theme === option.id }}
                className="items-center gap-1"
                onPress={() => setTheme(option.id)}
              >
                <View
                  className={
                    theme === option.id
                      ? "border-ring size-10 rounded-full border-2"
                      : "border-border size-10 rounded-full border"
                  }
                  style={{ backgroundColor: option.color }}
                />
                <Text
                  className={
                    theme === option.id
                      ? "text-center text-xs"
                      : "text-muted-foreground text-center text-xs"
                  }
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          {user !== null ? (
            <Button
              variant="destructive"
              onPress={() => signOut.mutate()}
              loading={signOut.isPending}
            >
              Log out
            </Button>
          ) : (
            <Button onPress={() => router.push("/auth/sign-in")}>Sign in</Button>
          )}
        </View>

        <View className="border-border gap-3 border-t pt-4">
          {[
            { label: "About", url: `${siteConfig.url}/about` },
            { label: "Privacy", url: `${siteConfig.url}/privacy` },
            { label: "Terms", url: `${siteConfig.url}/terms` },
            { label: "Support", url: `mailto:${siteConfig.supportEmail}` },
          ].map((link) => (
            <Pressable
              key={link.label}
              accessibilityRole="link"
              onPress={() => {
                Linking.openURL(link.url).catch(() => undefined);
              }}
            >
              <Text className="text-muted-foreground text-sm underline">{link.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
