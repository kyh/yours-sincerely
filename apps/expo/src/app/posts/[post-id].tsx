import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { PostContent } from "@/components/post/post-content";
import { PostForm } from "@/components/post/post-form";
import { queryClient, trpc } from "@/lib/api";
import { readingTime } from "@/lib/reading-time";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Port of apps/web (app)/posts/[postId]/post-page.tsx. */
export default function PostScreen() {
  const { "post-id": postId } = useLocalSearchParams<{ "post-id": string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useWorkspaceUser();

  const { data, isPending, isError } = useQuery(trpc.post.getPost.queryOptions({ postId }));
  const post = data?.post;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          accessibilityRole="button"
          className="active:bg-accent -ml-2 h-8 flex-row items-center gap-1 rounded-lg px-2"
          onPress={goBack}
        >
          <ArrowLeft size={16} color={colors.foreground} />
          <Text className="text-sm font-medium">Back</Text>
        </Pressable>
        {post !== undefined && <Text className="text-xs">{readingTime(post.content).text}</Text>}
      </View>

      {isError ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-sm">This letter is gone</Text>
        </View>
      ) : isPending || post === undefined ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pb-10"
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
                queryClient
                  .invalidateQueries(trpc.post.getPost.queryFilter({ postId }))
                  .catch(() => undefined);
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
      )}
    </SafeAreaView>
  );
}
