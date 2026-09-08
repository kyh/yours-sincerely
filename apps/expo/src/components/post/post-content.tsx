import { Pressable, View } from "react-native";
import { FEED_PREVIEW_MAX_LINES, needsFeedPreview } from "@repo/contracts/content";
import { useRouter } from "expo-router";

import type { FeedLayout } from "@/lib/feed-layout";
import type { FeedPost } from "@/lib/post-types";
import { Text } from "@/components/ui/text";
import { cn } from "cn";
import { CommentButton } from "./comment-button";
import { LikeButton } from "./like-button";
import { MoreButton } from "./more-button";
import { ShareButton } from "./share-button";
import { TimerButton } from "./timer-button";

/** Mirrors apps/web posts/_components/post-content.tsx. */
interface Props {
  post: FeedPost;
  layout?: FeedLayout;
  minHeight?: boolean;
  asLink?: boolean;
  showComment?: boolean;
  showTimer?: boolean;
  showMore?: boolean;
  onDeleted?: () => void;
}

export const PostContent = ({
  post,
  layout = "list",
  minHeight = false,
  asLink = true,
  showComment = true,
  showTimer = true,
  showMore = true,
  onDeleted,
}: Props) => {
  const router = useRouter();

  const openPost = () =>
    router.push({ params: { "post-id": post.id }, pathname: "/posts/[post-id]" });
  const openProfile = () => {
    if (post.userId === null) {
      return;
    }
    router.push({ params: { "user-id": post.userId }, pathname: "/profile/[user-id]" });
  };

  const truncateInFeed = asLink && layout === "list" && needsFeedPreview(post.content);

  const content = (
    <>
      <Text
        className={cn("text-base leading-6", minHeight && "min-h-72")}
        numberOfLines={truncateInFeed ? FEED_PREVIEW_MAX_LINES : undefined}
      >
        {post.content}
      </Text>
      {truncateInFeed ? (
        <Text className="text-muted-foreground mt-2 text-sm font-medium">Read full letter</Text>
      ) : null}
    </>
  );

  return (
    <View className={cn(layout === "stack" && "h-full w-full flex-col")}>
      {asLink ? (
        <Pressable accessibilityRole="link" accessibilityLabel="Open letter" onPress={openPost}>
          {content}
        </Pressable>
      ) : (
        content
      )}
      <View className={cn(layout === "stack" ? "mt-auto pt-3" : "mt-5")}>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm italic">Yours Sincerely,</Text>
          {post.userId === null ? (
            <Text className="text-sm italic">{post.createdBy}</Text>
          ) : (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${post.createdBy}'s profile`}
              onPress={openProfile}
            >
              <Text className="text-sm font-medium italic underline">{post.createdBy}</Text>
            </Pressable>
          )}
        </View>
        <View className="mt-3 flex-row items-center justify-between">
          {showComment ? <CommentButton post={post} /> : null}
          <LikeButton post={post} />
          {showTimer ? <TimerButton post={post} /> : null}
          <ShareButton post={post} />
          {showMore ? <MoreButton post={post} onDeleted={onDeleted} /> : null}
        </View>
      </View>
    </View>
  );
};
