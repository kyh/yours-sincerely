import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";

import type { FeedPost } from "@/lib/post-types";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useThemeColors } from "@/components/theme-colors";

type Props = {
  post: FeedPost;
};

export const CommentButton = ({ post }: Props) => {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${post.commentCount} comments, open post`}
      hitSlop={6}
      className="active:bg-accent h-8 flex-row items-center gap-1.5 rounded-lg px-2"
      onPress={() => router.push({ pathname: "/posts/[post-id]", params: { "post-id": post.id } })}
    >
      <MessageCircle size={16} color={colors.mutedForeground} />
      <AnimatedNumber value={post.commentCount} />
    </Pressable>
  );
};
