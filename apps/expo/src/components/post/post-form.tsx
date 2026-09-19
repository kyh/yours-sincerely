import { useEffect, useRef, useState } from "react";
import { TextInput, useWindowDimensions, View } from "react-native";
import { POST_EXPIRY_DAYS } from "@repo/contracts/content";
import { createPostInput } from "@repo/contracts/post";
import type { CreatePostInput } from "@repo/contracts/post";
import { useMutation } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { useBalloons } from "@/components/animations/balloons";
import { orpc } from "@/lib/api";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { clearPostDraft, getPostDraft, setPostDraft } from "@/lib/post-draft";
import { refreshAfterPostCreated } from "@/lib/query-policies";
import { useSeededState } from "@/lib/use-seeded-state";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { cn } from "cn";
import { KeyboardShortcutsView } from "../../../modules/keyboard-shortcuts/src/keyboard-shortcuts-view";

/** Port of apps/web posts/_components/post-form.tsx. */
interface PostFormProps {
  placeholder?: string;
  parentId?: string;
  onSuccess?: () => void;
  presentation?: "inline" | "drawer" | "dialog";
}

export const PostForm = ({
  placeholder,
  parentId,
  onSuccess,
  presentation = "inline",
}: PostFormProps) => {
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const { user } = useWorkspaceUser();
  const { celebrate } = useBalloons();

  const [content, setContent] = useState("");
  const [dialogContentHeight, setDialogContentHeight] = useState(120);
  const [createdBy, setCreatedBy] = useSeededState(user?.displayName, "Anonymous");
  const [error, setError] = useState<string | null>(null);
  const hasEditedContent = useRef(false);

  // Web carries the same draft between the feed composer and reply forms.
  useEffect(() => {
    let active = true;
    const restoreDraft = async () => {
      const draft = await getPostDraft();
      if (active && !hasEditedContent.current && draft !== null) {
        setContent(draft);
      }
    };
    void ignoreRejection(restoreDraft());
    return () => {
      active = false;
    };
  }, []);

  const createPost = useMutation(
    orpc.post.createPost.mutationOptions({
      onError: (err) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        void ignoreRejection(clearPostDraft());
        setContent("");
        setError(null);
        void ignoreRejection(refreshAfterPostCreated());
        onSuccess?.();
        void ignoreRejection(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        setTimeout(() => {
          toast.success("Your love letter has been published");
        }, 500);
        setTimeout(() => {
          celebrate();
        }, 600);
      },
    }),
  );

  const handleSubmit = () => {
    if (createPost.isPending) {
      return;
    }
    if (user?.disabled === true) {
      toast.error("Your account has been disabled");
      return;
    }
    const input: CreatePostInput = { content, createdBy, parentId };
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
    <KeyboardShortcutsView mode="compose" onSubmit={handleSubmit}>
      <View className="flex-col gap-2">
        <TextInput
          accessibilityLabel="Post content"
          multiline
          autoFocus={parentId === undefined}
          placeholder={placeholder ?? "Write a little love letter"}
          placeholderTextColor={colors.mutedForeground}
          value={content}
          scrollEnabled={presentation !== "dialog"}
          onContentSizeChange={
            presentation === "dialog"
              ? (event) => setDialogContentHeight(event.nativeEvent.contentSize.height)
              : undefined
          }
          onChangeText={(value) => {
            hasEditedContent.current = true;
            setContent(value);
            void ignoreRejection(setPostDraft(value));
          }}
          className={cn(
            "text-foreground font-sans",
            presentation === "inline" ? "text-base leading-6" : "text-sm",
          )}
          style={{
            height: presentation === "dialog" ? Math.max(120, dialogContentHeight) : undefined,
            maxHeight: presentation === "dialog" ? undefined : height * 0.6,
            minHeight: presentation === "drawer" ? Math.max(120, height * 0.25) : 120,
            padding: 0,
            textAlignVertical: "top",
          }}
        />
        {error !== null && (
          <Text accessibilityRole="alert" className="text-destructive text-xs">
            {error}
          </Text>
        )}
        <View className="flex-row items-center justify-between gap-1">
          <View className="flex-1 flex-col gap-1">
            <View className="flex-row flex-wrap items-center gap-1">
              <Text className="text-xs">Publishing as</Text>
              <TextInput
                accessibilityLabel="Publishing as"
                lineBreakModeIOS="clip"
                hitSlop={10}
                value={createdBy}
                onChangeText={setCreatedBy}
                className="text-foreground -m-1 h-6 min-w-11 shrink p-1 font-sans text-xs underline"
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
    </KeyboardShortcutsView>
  );
};
