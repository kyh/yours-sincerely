import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { updateUserInput } from "@repo/contracts/user";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { BlockedWriters } from "@/components/settings/blocked-writers";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useThemeColors } from "@/components/theme-colors";
import { themes, useTheme } from "@/components/theme-provider";
import { useReleasePushIdentity } from "@/components/notifications/push-notification-registration";
import { retireLegacySessionMigration } from "@/lib/legacy-session-migration";
import { deleteSessionCookie } from "@/lib/session-store";
import { orpc } from "@/lib/api";
import {
  refreshProfileData,
  refreshWorkspaceIdentity,
  resetAfterSessionChanged,
} from "@/lib/query-policies";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { useSeededState } from "@/lib/use-seeded-state";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { useTabNavigation } from "@/lib/use-tab-navigation";

/** Port of the web settings page: email (saved on blur), password reset,
    theme picker, sign out, account deletion. */
const SettingsScreen = () => {
  const router = useRouter();
  const navigateToTab = useTabNavigation();
  const { theme, setTheme } = useTheme();
  const { user, isPending, isError, refetch } = useWorkspaceUser();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [appearanceWidth, setAppearanceWidth] = useState(0);
  const appearanceColumns = width >= 768 ? 6 : 4;
  const appearanceOptionWidth =
    appearanceWidth > 0
      ? (appearanceWidth - 16 * (appearanceColumns - 1)) / appearanceColumns
      : undefined;
  const releasePushIdentity = useReleasePushIdentity();

  const [email, setEmail] = useSeededState(user?.email, "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPreparingDelete, setIsPreparingDelete] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateUser = useMutation(
    orpc.user.updateUser.mutationOptions({
      onError: () => toast.error("Could not update Settings. Please try again."),
      onSuccess: () => {
        toast.success("Settings successfully updated");
        void ignoreRejection(refreshProfileData());
        void ignoreRejection(refreshWorkspaceIdentity());
      },
    }),
  );
  const requestPasswordReset = useMutation(
    orpc.auth.requestPasswordReset.mutationOptions({
      onError: () => toast.error("Could not send password reset email. Please try again."),
      onSuccess: () => toast.success("Password reset email sent"),
    }),
  );
  const endLocalSession = async () => {
    await retireLegacySessionMigration();
    await deleteSessionCookie();
    await resetAfterSessionChanged();
    navigateToTab("/");
  };

  const signOutOnServer = useMutation(orpc.auth.signOut.mutationOptions({ networkMode: "always" }));
  const deleteAccount = useMutation(
    orpc.user.deleteUser.mutationOptions({
      onError: () => toast.error("Could not delete account. Please try again."),
      onSuccess: endLocalSession,
    }),
  );

  const confirmDeleteAccount = async () => {
    setIsPreparingDelete(true);
    try {
      await releasePushIdentity();
      deleteAccount.mutate();
    } catch {
      toast.error("Could not disconnect notifications. Please try again.");
    }
    setIsPreparingDelete(false);
  };

  const handleEmailBlur = () => {
    if (user === null || updateUser.isPending || email === (user.email ?? "")) {
      return;
    }
    const parsed = updateUserInput.safeParse({ email });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setEmailError(null);
    updateUser.mutate(parsed.data);
  };

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await releasePushIdentity();
      // The server only clears its cookie; the local wipe below is what signs
      // out, so an offline device must not be stuck signed in.
      await ignoreRejection(signOutOnServer.mutateAsync());
      await endLocalSession();
    } catch {
      toast.error("Could not clear this session. Please try again.");
    }
    setIsSigningOut(false);
  };

  let queryStatus: ReactNode = null;
  if (isPending) {
    queryStatus = (
      <View className="flex-1 items-center justify-center py-5">
        <Spinner />
      </View>
    );
  } else if (isError && user === null) {
    queryStatus = (
      <View className="flex-1 py-5">
        <QueryErrorState
          message="Couldn't load your settings. Check your connection and try again."
          onRetry={() => {
            void ignoreRejection(refetch());
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {queryStatus ?? (
        <ScrollView
          contentContainerStyle={{ gap: 24, paddingVertical: 20 }}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View className="border-border overflow-hidden rounded-md border">
            {user !== null && (
              <>
                <View className="border-border gap-2 border-b px-3 py-4">
                  <Text className="text-sm font-medium">Email</Text>
                  <Text className="text-muted-foreground text-xs">
                    You will continue to be anonymous, this email is just used for account recovery.
                  </Text>
                  <Input
                    accessibilityLabel="Email"
                    accessibilityState={{ busy: updateUser.isPending }}
                    editable={!updateUser.isPending}
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
                    returnKeyType="done"
                  />
                  {updateUser.isPending && (
                    <Text className="text-muted-foreground text-xs">Saving…</Text>
                  )}
                  {emailError !== null && (
                    <Text accessibilityRole="alert" className="text-destructive text-xs">
                      {emailError}
                    </Text>
                  )}
                </View>

                <View className="border-border gap-2 border-b px-3 py-4">
                  <Text className="text-sm font-medium">Password</Text>
                  <Button
                    variant="secondary"
                    disabled={updateUser.isPending || email !== (user.email ?? "")}
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

            <View className="border-border gap-4 border-b px-3 py-4">
              <Text className="text-sm font-medium">Appearance</Text>
              <View
                accessibilityRole="radiogroup"
                className="flex-row flex-wrap gap-4"
                onLayout={(event) => setAppearanceWidth(event.nativeEvent.layout.width)}
              >
                {themes.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: theme === option.id }}
                    className="min-h-11 min-w-11 items-center gap-1"
                    style={{ width: appearanceOptionWidth }}
                    onPress={() => setTheme(option.id)}
                  >
                    <View
                      className={
                        theme === option.id
                          ? "border-ring size-10 rounded-full border"
                          : "border-border size-10 rounded-full border"
                      }
                      style={{
                        backgroundColor: option.id === "system" ? colors.background : option.color,
                        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                      }}
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

            <View className="flex-row flex-wrap gap-2 px-3 py-4">
              {user === null ? (
                <Button
                  onPress={() =>
                    router.push({ params: { next: "/settings" }, pathname: "/auth/sign-in" })
                  }
                >
                  Sign in
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onPress={signOut}
                    loading={isSigningOut}
                    disabled={deleteAccount.isPending || isPreparingDelete}
                  >
                    Log out
                  </Button>
                  <Button
                    variant="destructive"
                    onPress={() => setDeleteDialogOpen(true)}
                    disabled={isSigningOut}
                  >
                    Delete account
                  </Button>
                </>
              )}
            </View>
          </View>

          {user !== null && <BlockedWriters />}
        </ScrollView>
      )}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        label="Delete account?"
      >
        <View className="gap-6">
          <View className="gap-2">
            <Text accessibilityRole="header" className="pr-7 text-base leading-none font-medium">
              Delete account?
            </Text>
            <Text className="text-muted-foreground text-sm">
              This permanently deletes your account, letters, and likes. This cannot be undone.
            </Text>
          </View>
          <Button
            variant="destructive"
            onPress={confirmDeleteAccount}
            loading={deleteAccount.isPending || isPreparingDelete}
            disabled={isSigningOut}
          >
            Delete my account
          </Button>
        </View>
      </Dialog>
    </View>
  );
};

export default SettingsScreen;
