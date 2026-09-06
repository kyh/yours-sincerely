import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { updateUserInput } from "@repo/contracts/user";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "@/lib/css-interop";
import { toast } from "sonner-native";

import { BackButton } from "@/components/layout/back-button";
import { BlockedWriters } from "@/components/settings/blocked-writers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { themes, useTheme } from "@/components/theme-provider";
import { useReleasePushIdentity } from "@/components/notifications/push-notification-registration";
import { retireLegacySessionMigration } from "@/lib/legacy-session-migration";
import { deleteSessionCookie } from "@/lib/session-store";
import { queryClient, orpc } from "@/lib/api";
import { refreshWorkspaceIdentity } from "@/lib/query-policies";
import { CONTENT_COLUMN_STYLE } from "@/lib/layout";
import { siteConfig, supportMailto } from "@/lib/site-config";
import { useSeededState } from "@/lib/use-seeded-state";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Port of the web settings page: email (saved on blur), password reset,
    theme picker, sign out, account deletion, legal links. */
export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useWorkspaceUser();
  const releasePushIdentity = useReleasePushIdentity();

  const [email, setEmail] = useSeededState(user?.email, "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPreparingDelete, setIsPreparingDelete] = useState(false);

  const updateUser = useMutation(
    orpc.user.updateUser.mutationOptions({
      onSuccess: () => {
        toast.success("Settings successfully updated");
        refreshWorkspaceIdentity().catch(() => undefined);
      },
      onError: () => toast.error("Could not update Settings. Please try again."),
    }),
  );
  const requestPasswordReset = useMutation(
    orpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => toast.success("Password reset email sent"),
      onError: () => toast.error("Could not send password reset email. Please try again."),
    }),
  );
  const endLocalSession = async () => {
    await deleteSessionCookie();
    await retireLegacySessionMigration();
    queryClient.clear();
    router.replace("/");
  };

  const signOutOnServer = useMutation(orpc.auth.signOut.mutationOptions());
  const deleteAccount = useMutation(
    orpc.user.deleteUser.mutationOptions({
      onSuccess: endLocalSession,
      onError: () => toast.error("Could not delete account. Please try again."),
    }),
  );

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account, letters, and likes. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setIsPreparingDelete(true);
            releasePushIdentity()
              .then(() => deleteAccount.mutate(undefined))
              .catch(() => toast.error("Could not disconnect notifications. Please try again."))
              .finally(() => setIsPreparingDelete(false));
          },
        },
      ],
    );
  };

  const handleEmailBlur = () => {
    if (user === null || email === (user.email ?? "")) return;
    const parsed = updateUserInput.safeParse({ email });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setEmailError(null);
    updateUser.mutate(parsed.data);
  };

  const signOut = () => {
    setIsSigningOut(true);
    releasePushIdentity()
      // The server only clears its cookie; the local wipe below is what signs
      // out, so an offline device must not be stuck signed in.
      .then(() => signOutOnServer.mutateAsync(undefined).catch(() => undefined))
      .then(endLocalSession)
      .catch(() => toast.error("Could not clear this session. Please try again."))
      .finally(() => setIsSigningOut(false));
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-5 py-3">
        <BackButton fallback="/" />
        <Text className="text-2xl font-bold tracking-tight">Settings</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-10"
        contentContainerStyle={CONTENT_COLUMN_STYLE}
      >
        {user !== null && (
          <>
            <View className="gap-2">
              <Text className="text-sm font-medium">Email</Text>
              <Text className="text-muted-foreground text-xs">
                You will continue to be anonymous, this email is just used for account recovery.
              </Text>
              <Input
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError(null);
                }}
                onBlur={handleEmailBlur}
                placeholder="Your email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {emailError !== null && (
                <Text className="text-destructive text-xs">{emailError}</Text>
              )}
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

        {user !== null && <BlockedWriters />}

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
            <>
              <Button variant="outline" onPress={signOut} loading={isSigningOut}>
                Log out
              </Button>
              <Button
                variant="destructive"
                onPress={confirmDeleteAccount}
                loading={deleteAccount.isPending || isPreparingDelete}
              >
                Delete account
              </Button>
            </>
          ) : (
            <Button onPress={() => router.push("/auth/sign-in")}>Sign in</Button>
          )}
        </View>

        <View className="border-border gap-3 border-t pt-4">
          {[
            { label: "About", url: `${siteConfig.url}/about` },
            { label: "Privacy", url: `${siteConfig.url}/privacy` },
            { label: "Terms", url: `${siteConfig.url}/terms` },
            { label: "Support", url: supportMailto(user?.id) },
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
