import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "@/lib/css-interop";

import { BackButton } from "@/components/layout/back-button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { PostContent } from "@/components/post/post-content";
import { PostForm } from "@/components/post/post-form";
import { queryClient, orpc } from "@/lib/api";
import { getReadingTime } from "@repo/contracts/content";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { CONTENT_COLUMN_STYLE } from "@/lib/layout";

/** Port of apps/web (app)/posts/[postId]/post-page.tsx. */
const PostScreen = () => {
  const params = useLocalSearchParams();
  const postIdParam = params["post-id"];
  const postId = Array.isArray(postIdParam) ? "" : (postIdParam ?? "");
  const router = useRouter();
  const { user } = useWorkspaceUser();

  const { data, error, isPending, isError, refetch } = useQuery({
    ...orpc.post.getPost.queryOptions({ input: { postId } }),
    enabled: postId.length > 0,
  });
  const post = data?.post;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const isGone =
    postId.length === 0 || (isError && error instanceof ORPCError && error.code === "NOT_FOUND");
  let content: ReactNode;
  if (isGone) {
    content = (
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-sm">This letter is gone</Text>
      </View>
    );
  } else if (isError) {
    content = (
      <QueryErrorState
        message="Couldn't load this letter. Check your connection and try again."
        onRetry={() => {
          void ignoreRejection(refetch());
        }}
      />
    );
  } else if (isPending || post === undefined) {
    content = (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  } else {
    content = (
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-10"
        contentContainerStyle={CONTENT_COLUMN_STYLE}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <PostContent post={post} asLink={false} showComment={false} onDeleted={goBack} />
        </Card>

        {user !== null && (
          <PostForm
            parentId={post.id}
            placeholder="Comment on this love letter..."
            onSuccess={() => {
              void ignoreRejection(
                queryClient.invalidateQueries({
                  queryKey: orpc.post.getPost.key({ input: { postId } }),
                }),
              );
            }}
          />
        )}

        <View>
          <View className="flex-row items-center gap-2 py-3">
            <Text className="text-muted-foreground text-sm">Comments ({post.commentCount})</Text>
            <View className="bg-border h-px flex-1" />
          </View>
          {(post.comments === undefined || post.comments.length === 0) && (
            <Text className="py-5 text-center text-sm">No comments</Text>
          )}
          {post.comments?.map((comment) => (
            <View key={comment.id} className="border-border border-b pt-5 pb-3">
              <PostContent post={comment} showTimer={false} showComment={false} asLink={false} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <BackButton fallback="/" label="Back" />
        {post !== undefined && <Text className="text-xs">{getReadingTime(post.content).text}</Text>}
      </View>

      {content}
    </SafeAreaView>
  );
};

export default PostScreen;
