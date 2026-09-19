import { Pressable, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Line } from "react-native-svg";

import type { FeedLayout } from "@/lib/feed-layout";
import type { FeedPost } from "@/lib/post-types";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
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
}

export const PostContent = ({
  post,
  layout = "list",
  minHeight = false,
  asLink = true,
  showComment = true,
  showTimer = true,
  showMore = true,
}: Props) => {
  const router = useRouter();
  const colors = useThemeColors();
  const { height } = useWindowDimensions();

  const openPost = () =>
    router.push({ params: { "post-id": post.id }, pathname: "/posts/[post-id]" });
  const openProfile = () => {
    if (post.userId === null) {
      return;
    }
    router.push({ params: { "user-id": post.userId }, pathname: "/profile/[user-id]" });
  };

  const content = (
    <Text
      className="text-base leading-6"
      style={minHeight ? { minHeight: height * 0.5 } : undefined}
      selectable={!asLink}
    >
      {post.content}
    </Text>
  );

  return (
    <View className={cn(layout === "stack" && "w-full flex-col")}>
      {asLink ? (
        <Pressable accessibilityRole="link" accessibilityLabel="Open letter" onPress={openPost}>
          {content}
        </Pressable>
      ) : (
        content
      )}
      <View
        className={cn(
          "flex-col sm:flex-row sm:justify-between",
          layout === "stack" ? "mt-auto pt-3" : "mt-5",
        )}
      >
        <View className="flex-row flex-wrap items-center gap-1">
          <Text className="text-sm italic">Yours Sincerely,</Text>
          {post.userId !== null && (
            <Pressable
              className="shrink"
              hitSlop={12}
              accessibilityRole="link"
              accessibilityLabel={`Open ${post.createdBy}'s profile`}
              onPress={openProfile}
            >
              <Text className="text-sm italic">{post.createdBy || "Anonymous"}</Text>
              <View pointerEvents="none" className="absolute right-0 bottom-0.5 left-0">
                <Svg width="100%" height={1}>
                  <Line
                    x1={0}
                    y1={0.5}
                    x2="100%"
                    y2={0.5}
                    stroke={colors.foreground}
                    strokeDasharray="1 2"
                  />
                </Svg>
              </View>
            </Pressable>
          )}
        </View>
        <View className="mt-3 flex-row items-center justify-between sm:mt-0 sm:gap-1">
          {showComment ? <CommentButton post={post} /> : null}
          <LikeButton post={post} />
          {showTimer ? <TimerButton post={post} /> : null}
          <ShareButton post={post} />
          {showMore ? <MoreButton post={post} /> : null}
        </View>
      </View>
    </View>
  );
};
