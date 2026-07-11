import { useState } from "react";
import { Linking, Pressable, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { ClipboardCopy, Share as ShareIcon } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { toast } from "sonner-native";

import type { FeedPost } from "@/lib/post-types";
import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { siteConfig } from "@/lib/site-config";

type Props = {
  post: FeedPost;
};

const DrawerItem = ({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    className="active:bg-accent flex-row items-center gap-3 rounded-lg p-4"
    onPress={onPress}
  >
    {icon}
    <Text className="text-sm font-medium">{label}</Text>
  </Pressable>
);

export const ShareButton = ({ post }: Props) => {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const postUrl = `${siteConfig.url}/posts/${post.id}`;
  const encodedPostUrl = encodeURIComponent(postUrl);
  const iconSize = 16;

  // Native share is web parity (the web button prefers navigator.share too);
  // fall back to the curated drawer only when the OS sheet fails to present.
  const share = () => {
    Share.share({ title: "A tiny beautiful letter", url: postUrl, message: postUrl }).catch(() => {
      setIsOpen(true);
    });
  };

  const copyLink = () => {
    setIsOpen(false);
    Clipboard.setStringAsync(postUrl).then(
      () => toast.success("📝 Copied to Clipboard"),
      () => undefined,
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share post"
        hitSlop={6}
        className="active:bg-accent size-8 items-center justify-center rounded-lg"
        onPress={share}
      >
        <ShareIcon size={iconSize} color={colors.mutedForeground} />
      </Pressable>
      <BottomDrawer open={isOpen} onClose={() => setIsOpen(false)}>
        <DrawerItem
          icon={
            <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={colors.foreground}>
              <Path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
            </Svg>
          }
          label="Share on Facebook"
          onPress={() => {
            setIsOpen(false);
            Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`).catch(
              () => undefined,
            );
          }}
        />
        <DrawerItem
          icon={
            <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={colors.foreground}>
              <Path d="M15.3 5.55a2.9 2.9 0 0 0-2.9 2.847l-.028 1.575a.6.6 0 0 1-.68.583l-1.561-.212c-2.054-.28-4.022-1.226-5.91-2.799-.598 3.31.57 5.603 3.383 7.372l1.747 1.098a.6.6 0 0 1 .034.993L7.793 18.17c.947.059 1.846.017 2.592-.131 4.718-.942 7.855-4.492 7.855-10.348 0-.478-1.012-2.141-2.94-2.141zm-4.9 2.81a4.9 4.9 0 0 1 8.385-3.355c.711-.005 1.316.175 2.669-.645-.335 1.64-.5 2.352-1.214 3.331 0 7.642-4.697 11.358-9.463 12.309-3.268.652-8.02-.419-9.382-1.841.694-.054 3.514-.357 5.144-1.55C5.16 15.7-.329 12.47 3.278 3.786c1.693 1.977 3.41 3.323 5.15 4.037 1.158.475 1.442.465 1.973.538z" />
            </Svg>
          }
          label="Share on Twitter"
          onPress={() => {
            setIsOpen(false);
            Linking.openURL(`http://twitter.com/share?url=${encodedPostUrl}`).catch(
              () => undefined,
            );
          }}
        />
        <DrawerItem
          icon={<ClipboardCopy size={iconSize} color={colors.foreground} />}
          label="Copy Link"
          onPress={copyLink}
        />
      </BottomDrawer>
    </>
  );
};
