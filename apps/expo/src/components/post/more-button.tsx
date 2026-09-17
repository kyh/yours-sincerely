import type { ReactNode } from "react";
import { useState } from "react";
import { Linking, Pressable, useWindowDimensions } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ban, Flag, MoreVertical, Trash2, TriangleAlert } from "lucide-react-native";
import { toast } from "sonner-native";

import type { FeedPost } from "@/lib/post-types";
import { BottomDrawer, DrawerItem } from "@/components/ui/bottom-drawer";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { orpc } from "@/lib/api";
import { ignoreRejection } from "@/lib/ignore-rejection";
import {
  refreshBlocks,
  refreshPostContent,
  refreshProfileData,
  refreshWorkspaceIdentityIfAnonymous,
} from "@/lib/query-policies";
import { siteConfig } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

interface Props {
  post: FeedPost;
}

interface PostMenuItem {
  icon: ReactNode;
  label: string;
  handlePress: () => void;
}

export const MoreButton = ({ post }: Props) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const colors = useThemeColors();
  const { user } = useWorkspaceUser();
  const [isOpen, setIsOpen] = useState(false);

  const deleteMutation = useMutation(
    orpc.post.deletePost.mutationOptions({
      onError: () => toast.error("Could not delete this post. Please try again."),
      onSuccess: () => {
        toast.success("You have deleted this post");
        void ignoreRejection(refreshPostContent());
        void ignoreRejection(refreshProfileData());
      },
    }),
  );
  const flagMutation = useMutation(
    orpc.flag.createFlag.mutationOptions({
      onError: () => toast.error("Could not flag this post. Please try again."),
      onSuccess: () => {
        toast.success("You have flagged this post, we will be reviewing it shortly");
        void ignoreRejection(refreshPostContent());
        void ignoreRejection(refreshWorkspaceIdentityIfAnonymous());
      },
    }),
  );
  const blockMutation = useMutation(
    orpc.block.createBlock.mutationOptions({
      onError: () => toast.error("Could not block this user. Please try again."),
      onSuccess: () => {
        toast.success("You have blocked this user");
        // The blocked author's letters leave the feed AND the author joins the
        // viewer's blocked list — refreshBlocks covers both.
        void ignoreRejection(refreshBlocks());
      },
    }),
  );

  const isPostOwner = post.userId === user?.id;
  const iconSize = 16;
  const items: PostMenuItem[] = [
    {
      handlePress: async () => {
        try {
          await Linking.openURL(
            `mailto:${siteConfig.supportEmail}?subject=Report YS Post: ${post.id}`,
          );
        } catch {
          toast.error(
            `Could not open your mail app. Report this post to ${siteConfig.supportEmail}`,
          );
        }
      },
      icon: <Flag size={iconSize} color={colors.foreground} />,
      label: "Report Post",
    },
  ];
  if (user !== null && isPostOwner) {
    items.push({
      handlePress: () => deleteMutation.mutate({ postId: post.id }),
      icon: <Trash2 size={iconSize} color={colors.foreground} />,
      label: "Delete Post",
    });
  }
  if (user !== null && !isPostOwner) {
    items.push({
      handlePress: () => flagMutation.mutate({ postId: post.id }),
      icon: <TriangleAlert size={iconSize} color={colors.foreground} />,
      label: "Mark as inappropriate",
    });
    const blockingId = post.userId;
    if (blockingId !== null) {
      items.push({
        handlePress: () => blockMutation.mutate({ blockingId }),
        icon: <Ban size={iconSize} color={colors.foreground} />,
        label: "Stop seeing content from this user",
      });
    }
  }
  const menuItems = items.map((item, index) =>
    isWide ? (
      <Button
        key={item.label}
        variant="ghost"
        className="rounded-sm px-8"
        style={{
          borderBottomColor: index < items.length - 1 ? colors.border : "transparent",
          height: 66,
        }}
        onPress={item.handlePress}
      >
        {item.icon}
        <Text className="text-foreground text-sm font-medium">{item.label}</Text>
      </Button>
    ) : (
      <DrawerItem key={item.label} icon={item.icon} label={item.label} onPress={item.handlePress} />
    ),
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Post options"
        hitSlop={6}
        className="active:bg-accent size-8 items-center justify-center rounded-lg"
        onPress={() => setIsOpen(true)}
      >
        <MoreVertical size={iconSize} color={colors.mutedForeground} />
      </Pressable>
      {isWide ? (
        <Dialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          label="Post Settings"
          padding={0}
          showCloseButton={false}
        >
          {menuItems}
        </Dialog>
      ) : (
        <BottomDrawer open={isOpen} onClose={() => setIsOpen(false)}>
          {menuItems}
        </BottomDrawer>
      )}
    </>
  );
};
