import { Pressable, Share } from "react-native";
import { Share as ShareIcon } from "lucide-react-native";

import type { FeedPost } from "@/lib/post-types";
import { useThemeColors } from "@/components/theme-colors";
import { siteConfig } from "@/lib/site-config";

type Props = {
  post: FeedPost;
};

export const ShareButton = ({ post }: Props) => {
  const colors = useThemeColors();
  const postUrl = `${siteConfig.url}/posts/${post.id}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Share post"
      className="active:bg-accent size-8 items-center justify-center rounded-lg"
      onPress={() => {
        Share.share({ title: "A tiny beautiful letter", url: postUrl, message: postUrl }).catch(
          () => undefined,
        );
      }}
    >
      <ShareIcon size={16} color={colors.mutedForeground} />
    </Pressable>
  );
};
