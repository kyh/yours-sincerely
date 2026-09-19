import type { ReactNode } from "react";
import { View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { useLocalSearchParams } from "expo-router";
import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";

import { BackButton } from "@/components/layout/back-button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { PostContent } from "@/components/post/post-content";
import { PostForm } from "@/components/post/post-form";
import { orpc } from "@/lib/api";
import { getReadingTime } from "@repo/contracts/content";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { ignoreRejection } from "@/lib/ignore-rejection";

/** Port of apps/web (app)/posts/[postId]/post-page.tsx. */
const PostScreen = () => {
  const params = useLocalSearchParams();
  const postIdParam = params["post-id"];
  const postId = Array.isArray(postIdParam) ? "" : (postIdParam ?? "");
  const { user } = useWorkspaceUser();

  const { data, error, isPending, isError, refetch } = useQuery({
    ...orpc.post.getPost.queryOptions({ input: { postId } }),
    enabled: postId.length > 0,
  });
  const post = data?.post;

  const isGone =
    postId.length === 0 || (isError && error instanceof ORPCError && error.code === "NOT_FOUND");
  let content: ReactNode;
  if (isGone) {
    content = (
      <View className="flex-1 items-center justify-center px-5 py-5">
        <Text className="text-sm">This letter is gone</Text>
      </View>
    );
  } else if (isError && post === undefined) {
    content = (
      <View className="flex-1 py-5">
        <QueryErrorState
          message="Couldn't load this letter. Check your connection and try again."
          onRetry={() => {
            void ignoreRejection(refetch());
          }}
        />
      </View>
    );
  } else if (isPending || post === undefined) {
    content = (
      <View className="flex-1 items-center justify-center py-5">
        <Spinner />
      </View>
    );
  } else {
    content = (
      <LegendList
        style={{ flex: 1 }}
        data={post.comments ?? []}
        keyExtractor={(comment) => comment.id}
        contentContainerStyle={{ paddingVertical: 20 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        ListHeaderComponent={
          <View className="gap-5">
            <View className="flex-row items-center justify-between">
              <BackButton fallback="/" label="Back" />
              <Text className="text-xs">{getReadingTime(post.content).text}</Text>
            </View>
            {isError && (
              <QueryErrorState
                message="Couldn't refresh this letter."
                onRetry={() => {
                  void ignoreRejection(refetch());
                }}
              />
            )}
            <Card>
              <PostContent post={post} layout="stack" asLink={false} showComment={false} />
            </Card>

            {user !== null && (
              <PostForm parentId={post.id} placeholder="Comment on this love letter..." />
            )}

            <View className="flex-row items-center gap-2 py-3">
              <Text className="text-muted-foreground text-sm">Comments ({post.commentCount})</Text>
              <View className="bg-border h-px flex-1" />
            </View>
          </View>
        }
        ListEmptyComponent={<Text className="py-5 text-center text-sm">No comments</Text>}
        renderItem={({ item }) => (
          <View className="border-border border-b pt-5 pb-3">
            <PostContent post={item} showTimer={false} showComment={false} />
          </View>
        )}
      />
    );
  }

  return content;
};

export default PostScreen;
