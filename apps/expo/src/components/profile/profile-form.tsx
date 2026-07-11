import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { updateUserInput } from "@repo/contracts/user";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { ProfileAvatar } from "@/components/profile-avatar";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { queryClient, trpc } from "@/lib/api";

/** Avatar + editable display name (owner only), saved on blur —
    port of the web profile-form. */
type Props = {
  userId: string;
  readonly?: boolean;
};

export const ProfileForm = ({ userId, readonly = false }: Props) => {
  const colors = useThemeColors();
  const { data } = useQuery(trpc.user.getUser.queryOptions({ userId }));
  const user = data?.user;

  const [displayName, setDisplayName] = useState("Anonymous");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName !== undefined && user.displayName !== null) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  const updateUser = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess: () => {
        toast.success("Profile successfully updated");
        queryClient
          .invalidateQueries(trpc.user.getUser.queryFilter({ userId }))
          .catch(() => undefined);
        queryClient.invalidateQueries(trpc.auth.workspace.queryFilter()).catch(() => undefined);
      },
      onError: () => {
        toast.error("Could not update profile. Please try again.");
      },
    }),
  );

  const handleBlur = () => {
    if (readonly || user === undefined || user === null) return;
    if (displayName === (user.displayName ?? "Anonymous")) {
      setError(null);
      return;
    }
    const parsed = updateUserInput.safeParse({ userId, displayName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    setError(null);
    updateUser.mutate(parsed.data);
  };

  return (
    <View className="items-center gap-2">
      <ProfileAvatar name={user?.displayName ?? user?.id} />
      <TextInput
        accessibilityLabel="Display name"
        accessibilityState={{ disabled: readonly, busy: updateUser.isPending }}
        value={displayName}
        editable={!readonly && !updateUser.isPending}
        onChangeText={(value) => {
          setDisplayName(value);
          setError(null);
        }}
        onBlur={handleBlur}
        placeholder="Your name"
        placeholderTextColor={colors.mutedForeground}
        className="text-foreground rounded px-3 py-1 font-sans text-xl font-bold"
        style={{ textAlign: "center" }}
      />
      {updateUser.isPending && <Text className="text-muted-foreground text-xs">Saving…</Text>}
      {error !== null && <Text className="text-destructive text-xs">{error}</Text>}
    </View>
  );
};
