import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { POST_EXPIRY_DAYS, createPostInput, type CreatePostInput } from "@repo/contracts";
import { useMutation } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { useBalloons } from "@/components/animations/balloons";
import { trpc } from "@/lib/api";
import { clearPostDraft, getPostDraft, setPostDraft } from "@/lib/post-draft";
import { refreshAfterPostCreated } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Port of apps/web posts/_components/post-form.tsx. */
type PostFormProps = {
  placeholder?: string;
  parentId?: string;
  onSuccess?: () => void;
};

export const PostForm = ({ placeholder, parentId, onSuccess }: PostFormProps) => {
  const colors = useThemeColors();
  const { user } = useWorkspaceUser();
  const { celebrate } = useBalloons();

  const [content, setContent] = useState("");
  const [createdBy, setCreatedBy] = useState(user?.displayName ?? "Anonymous");
  const [error, setError] = useState<string | null>(null);

  // Restore draft (feed form only — comment drafts aren't persisted on web either).
  useEffect(() => {
    if (parentId !== undefined) return;
    getPostDraft().then((draft) => {
      if (draft !== null) setContent(draft);
      return undefined;
    });
  }, [parentId]);

  useEffect(() => {
    if (user?.displayName !== undefined && user.displayName !== null) {
      setCreatedBy(user.displayName);
    }
  }, [user?.displayName]);

  const createPost = useMutation(
    trpc.post.createPost.mutationOptions({
      onSuccess: () => {
        if (parentId === undefined) clearPostDraft().catch(() => undefined);
        setContent("");
        setError(null);
        refreshAfterPostCreated().catch(() => undefined);
        onSuccess?.();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        setTimeout(() => {
          toast.success("Your love letter has been published");
        }, 500);
        setTimeout(() => {
          celebrate();
        }, 600);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const handleSubmit = () => {
    if (user?.disabled === true) {
      toast.error("Your account has been disabled");
      return;
    }
    const input: CreatePostInput = { parentId, content, createdBy };
    const parsed = createPostInput.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid post");
      return;
    }
    setError(null);
    createPost.mutate(parsed.data);
  };

  const expiry = addDays(new Date(), POST_EXPIRY_DAYS);

  return (
    <View className="flex-col gap-2">
      <TextInput
        multiline
        autoFocus={parentId === undefined}
        placeholder={placeholder ?? "Write a little love letter"}
        placeholderTextColor={colors.mutedForeground}
        value={content}
        onChangeText={(value) => {
          setContent(value);
          if (parentId === undefined) setPostDraft(value).catch(() => undefined);
        }}
        className="text-foreground min-h-32 max-h-80 font-sans text-base leading-6"
        style={{ textAlignVertical: "top" }}
      />
      {error !== null && <Text className="text-destructive text-xs">{error}</Text>}
      <View className="flex-row items-end justify-between gap-1">
        <View className="flex-1 flex-col gap-1">
          <View className="flex-row flex-wrap items-center gap-1">
            <Text className="text-xs">Publishing as</Text>
            <TextInput
              value={createdBy}
              onChangeText={setCreatedBy}
              className="text-foreground p-0 font-sans text-xs underline"
            />
          </View>
          <Text className="text-muted-foreground text-xs">
            This post will expire on {format(expiry, "MMMM do")}
          </Text>
        </View>
        <Button onPress={handleSubmit} loading={createPost.isPending}>
          Publish
        </Button>
      </View>
    </View>
  );
};
