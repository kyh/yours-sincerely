import { useState } from "react";
import { Linking, Pressable } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ban, Flag, MoreVertical, Trash2, TriangleAlert } from "lucide-react-native";
import { toast } from "sonner-native";

import type { FeedPost } from "@/lib/post-types";
import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { queryClient, trpc } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

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

export const MoreButton = ({ post }: Props) => {
  const colors = useThemeColors();
  const { user } = useWorkspaceUser();
  const [isOpen, setIsOpen] = useState(false);

  const invalidateFeed = () =>
    queryClient.invalidateQueries(trpc.post.getFeed.infiniteQueryFilter());

  const deleteMutation = useMutation(
    trpc.post.deletePost.mutationOptions({
      onSuccess: () => {
        toast.success("You have deleted this post");
        invalidateFeed().catch(() => undefined);
      },
    }),
  );
  const flagMutation = useMutation(
    trpc.flag.createFlag.mutationOptions({
      onSuccess: () => {
        toast.success("You have flagged this post, we will be reviewing it shortly");
      },
    }),
  );
  const blockMutation = useMutation(
    trpc.block.createBlock.mutationOptions({
      onSuccess: () => {
        toast.success("You have blocked this user");
        invalidateFeed().catch(() => undefined);
      },
    }),
  );

  const isPostOwner = post.userId === user?.id;
  const iconSize = 16;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Post options"
        className="active:bg-accent size-8 items-center justify-center rounded-lg"
        onPress={() => setIsOpen(true)}
      >
        <MoreVertical size={iconSize} color={colors.mutedForeground} />
      </Pressable>
      <BottomDrawer open={isOpen} onClose={() => setIsOpen(false)}>
        <DrawerItem
          icon={<Flag size={iconSize} color={colors.foreground} />}
          label="Report Post"
          onPress={() => {
            setIsOpen(false);
            Linking.openURL(
              `mailto:${siteConfig.supportEmail}?subject=Report YS Post: ${post.id}`,
            ).catch(() => undefined);
          }}
        />
        {user !== null && isPostOwner ? (
          <DrawerItem
            icon={<Trash2 size={iconSize} color={colors.foreground} />}
            label="Delete Post"
            onPress={() => {
              setIsOpen(false);
              deleteMutation.mutate({ postId: post.id });
            }}
          />
        ) : null}
        {user !== null && !isPostOwner ? (
          <DrawerItem
            icon={<TriangleAlert size={iconSize} color={colors.foreground} />}
            label="Mark as inappropriate"
            onPress={() => {
              setIsOpen(false);
              flagMutation.mutate({ postId: post.id });
            }}
          />
        ) : null}
        {user !== null && !isPostOwner && post.userId !== null ? (
          <DrawerItem
            icon={<Ban size={iconSize} color={colors.foreground} />}
            label="Stop seeing content from this user"
            onPress={() => {
              setIsOpen(false);
              const blockingId = post.userId;
              if (blockingId === null) return;
              blockMutation.mutate({ blockingId });
            }}
          />
        ) : null}
      </BottomDrawer>
    </>
  );
};
