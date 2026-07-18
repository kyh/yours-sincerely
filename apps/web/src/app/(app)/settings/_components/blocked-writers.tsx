"use client";

import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProfileAvatar } from "@/components/profile-avatar";
import { getAvatarUrl } from "@/lib/avatars";
import { refreshBlocks } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { useTRPC } from "@/trpc/react";

/**
 * Blocking used to be a one-way door: one tap from a post's "..." menu, permanent,
 * with no inventory and no way back. This is the other half of the control.
 *
 * Blocked authors are anonymous, so a name is not an identifier — a list of twelve
 * rows reading "Anonymous" is useless. The avatar is: `getLegacyAvatarIndex` maps a
 * display name to one of 20 avatars deterministically and stably, so it is the only
 * durable visual identity the system has for an anonymous writer.
 *
 * We deliberately do NOT show an excerpt of a blocked author's letters, even though
 * it would identify them best. Showing someone's words back to the person who chose
 * not to see them is exactly the thing they asked us not to do.
 */
export const BlockedWriters = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const user = useWorkspaceUser();

  const blocks = useQuery({
    ...trpc.block.listBlocks.queryOptions(),
    // listBlocks is a protectedProcedure; an anonymous visitor has nothing to list.
    enabled: !!user,
  });

  const deleteBlock = useMutation(
    trpc.block.deleteBlock.mutationOptions({
      onSuccess: async () => {
        // The author's letters return to the feed immediately — no reload.
        await refreshBlocks(queryClient, trpc);
        toast.success("You will see content from this writer again");
      },
      onError: () => toast.error("Could not unblock this writer. Please try again."),
    }),
  );

  if (!user) return null;

  const blocked = blocks.data?.blocks ?? [];

  return (
    <div className="outline-border space-y-4 rounded-md px-3 py-4 outline -outline-offset-1">
      <Label>Blocked writers</Label>

      {blocks.isPending ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : blocked.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You haven&apos;t blocked anyone. Blocking a writer hides all of their letters from your
          feed.
        </p>
      ) : (
        <ul className="divide-border -my-2 divide-y">
          {blocked.map((writer) => {
            const displayName = writer.displayName ?? "Anonymous";
            return (
              <li key={writer.blockingId} className="flex items-center gap-3 py-2">
                <ProfileAvatar
                  displayName={displayName}
                  src={writer.displayImage ?? getAvatarUrl(displayName)}
                  alt=""
                />
                <span className="min-w-0 flex-1 truncate text-sm">{displayName}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={
                    deleteBlock.isPending && deleteBlock.variables?.blockingId === writer.blockingId
                  }
                  onClick={() => deleteBlock.mutate({ blockingId: writer.blockingId })}
                >
                  Unblock
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
