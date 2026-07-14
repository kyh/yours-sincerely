import { View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { trpc } from "@/lib/api";
import { refreshBlocks } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/**
 * Native half of the unblock surface. Mirrors
 * `apps/web/src/app/(app)/settings/_components/blocked-writers.tsx` — one contract,
 * two implementations (web and native UI stay separate by decision).
 *
 * Blocked authors are anonymous, so the deterministic avatar is the only stable
 * identity we can show. We deliberately do not surface an excerpt of their letters:
 * showing a blocked writer's words back to the person who blocked them is exactly
 * what they asked us not to do.
 */
export const BlockedWriters = () => {
  const { user } = useWorkspaceUser();

  const blocks = useQuery({
    ...trpc.block.listBlocks.queryOptions(),
    // listBlocks is a protectedProcedure; an anonymous visitor has nothing to list.
    enabled: user !== null,
  });

  const deleteBlock = useMutation(
    trpc.block.deleteBlock.mutationOptions({
      onSuccess: async () => {
        // The writer's letters return to the feed immediately — no restart.
        await refreshBlocks();
        toast.success("You will see content from this writer again");
      },
      onError: () => toast.error("Could not unblock this writer. Please try again."),
    }),
  );

  if (user === null) return null;

  const blocked = blocks.data?.blocks ?? [];

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium">Blocked writers</Text>

      {blocks.isPending ? (
        <Text className="text-muted-foreground text-xs">Loading…</Text>
      ) : blocked.length === 0 ? (
        <Text className="text-muted-foreground text-xs">
          You haven't blocked anyone. Blocking a writer hides all of their letters from your feed.
        </Text>
      ) : (
        <View className="gap-2">
          {blocked.map((writer) => {
            const displayName = writer.displayName ?? "Anonymous";
            return (
              <View key={writer.blockingId} className="flex-row items-center gap-3">
                <ProfileAvatar name={displayName} size={36} />
                <Text className="flex-1 text-sm" numberOfLines={1}>
                  {displayName}
                </Text>
                <Button
                  variant="secondary"
                  loading={
                    deleteBlock.isPending && deleteBlock.variables.blockingId === writer.blockingId
                  }
                  onPress={() => deleteBlock.mutate({ blockingId: writer.blockingId })}
                >
                  Unblock
                </Button>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
