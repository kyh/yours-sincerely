"use client";

import { useState } from "react";
import { LIKE_BURST_COLOR_PAIRS } from "@repo/contracts/content";
import { createLikeMutationHandlers } from "@repo/contracts/like-cache";
import { toast } from "@repo/ui/components/sonner";
import NumberFlow from "@number-flow/react";
import { ORPCError } from "@orpc/client";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "motion/react";

import type { FeedPost, RouterOutputs } from "@repo/api";
import {
  markPostContentStale,
  refreshPostContent,
  refreshWorkspaceIdentityIfAnonymous,
} from "@/lib/query-policies";
import { useIdentityScope } from "@/lib/use-identity-scope";
import { orpc } from "@/orpc/react";

const CircleAnimation = () => {
  const CIRCLE_RADIUS = 20;

  return (
    <svg
      className="pointer-events-none absolute -top-3 -left-3"
      style={{
        height: CIRCLE_RADIUS * 2,
        width: CIRCLE_RADIUS * 2,
      }}
    >
      <m.circle
        cx={CIRCLE_RADIUS}
        cy={CIRCLE_RADIUS}
        r={CIRCLE_RADIUS - 2}
        fill="none"
        initial={{
          scale: 0,
          stroke: "#E5214A",
          strokeWidth: CIRCLE_RADIUS * 2,
        }}
        animate={{
          scale: 1,
          stroke: "#CC8EF5",
          strokeWidth: 0,
        }}
        transition={{
          duration: 0.4,
          // cubic-out
          ease: [0.33, 1, 0.68, 1],
        }}
      />
    </svg>
  );
};

const BURST_RADIUS = 32;
const START_RADIUS = 4;
const PATH_SCALE_FACTOR = 0.8;

// Particle component for burst animation
const Particle = ({
  fromColor,
  toColor,
  index,
  totalParticles,
}: {
  fromColor: string;
  toColor: string;
  index: number;
  totalParticles: number;
}) => {
  // Calculate angle based on index with 45 degree offset
  const angle = (index / totalParticles) * 360 + 45;
  const radians = (angle * Math.PI) / 180;

  // Both randoms are drawn once per mount — a particle is remounted for every
  // burst — so a re-render mid-flight cannot retarget the animation.
  // Add randomness to the burst distance (±15%)
  // oxlint-disable-next-line react/hook-use-state -- initializer-only state, never set
  const [randomFactor] = useState(() => 0.85 + Math.random() * 0.3);
  const burstDistance = BURST_RADIUS * randomFactor;

  // Randomize duration between 500-700ms
  // oxlint-disable-next-line react/hook-use-state -- initializer-only state, never set
  const [duration] = useState(() => 500 + Math.random() * 200);

  // Calculate the degree shift (13 degrees in radians)
  const degreeShift = (13 * Math.PI) / 180;

  return (
    <m.div
      className="pointer-events-none absolute size-1.5 rounded-full"
      style={{ backgroundColor: fromColor, opacity: 0 }}
      initial={{
        backgroundColor: fromColor,
        opacity: 0,
        scale: 1,
        x: Math.cos(radians) * START_RADIUS * PATH_SCALE_FACTOR,
        y: Math.sin(radians) * START_RADIUS * PATH_SCALE_FACTOR,
      }}
      animate={{
        backgroundColor: toColor,
        opacity: [0, 1, 1, 0],
        scale: 0,
        x: Math.cos(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
        y: Math.sin(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
      }}
      transition={{
        backgroundColor: {
          delay: 0.3,
          duration: duration / 1000,
        },
        opacity: {
          delay: 0.4,
          duration: duration / 1000,
          times: [0, 0.01, 0.99, 1],
        },
        scale: {
          delay: 0.3,
          duration: duration / 1000,
          // quad.in for scaling
          ease: [0.55, 0.085, 0.68, 0.53],
        },
        x: {
          delay: 0.3,
          duration: duration / 1000,
          // quint.out for movement
          ease: [0.23, 1, 0.32, 1],
        },
        y: {
          delay: 0.3,
          duration: duration / 1000,
          // quint.out for movement
          ease: [0.23, 1, 0.32, 1],
        },
      }}
    />
  );
};

// Burst animation with particles
const BurstAnimation = () => (
  <div className="pointer-events-none absolute -top-3 -left-3 grid size-10 place-items-center">
    {LIKE_BURST_COLOR_PAIRS.map((colors, index) => (
      <Particle
        key={colors.id}
        fromColor={colors.from}
        toColor={colors.to}
        index={index}
        totalParticles={LIKE_BURST_COLOR_PAIRS.length}
      />
    ))}
  </div>
);

interface Props {
  post: FeedPost;
}

type FeedQueryData = InfiniteData<RouterOutputs["post"]["getFeed"]>;
type PostQueryData = RouterOutputs["post"]["getPost"];

const FEED_FILTER = { queryKey: orpc.post.getFeed.key({ type: "infinite" }) };
const POST_FILTER = { queryKey: orpc.post.getPost.key() };

/** Binds the shared like bookkeeping to this client's feed and post-detail caches. */
const likeMutationHandlers = (queryClient: QueryClient, postId: string, liked: boolean) => {
  const handlers = createLikeMutationHandlers<FeedQueryData, PostQueryData>(
    {
      cancel: async () => {
        await Promise.all([
          queryClient.cancelQueries(FEED_FILTER),
          queryClient.cancelQueries(POST_FILTER),
        ]);
      },
      readFeeds: () => queryClient.getQueriesData<FeedQueryData>(FEED_FILTER),
      readPosts: () => queryClient.getQueriesData<PostQueryData>(POST_FILTER),
      // A failed like can still have minted the anonymous user.
      refresh: () => {
        void markPostContentStale(queryClient);
        void refreshWorkspaceIdentityIfAnonymous(queryClient);
      },
      writeFeed: (queryKey, data) => queryClient.setQueryData(queryKey, data),
      writePost: (queryKey, data) => queryClient.setQueryData(queryKey, data),
    },
    postId,
    liked,
  );
  return {
    ...handlers,
    onError: (...args: Parameters<typeof handlers.onError>) => {
      handlers.onError(...args);
      const [error] = args;
      if (error instanceof ORPCError && error.code === "NOT_FOUND") {
        toast.error("This letter has been deleted.");
        // Unlike a like, this changes which letters the feed holds.
        void refreshPostContent(queryClient);
        return;
      }
      toast.error("Could not update this like. Please try again.");
    },
  };
};

export const LikeButton = ({ post }: Props) => {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  const identityScope = useIdentityScope();
  const createMutate = useMutation(
    orpc.like.createLike.mutationOptions({
      ...likeMutationHandlers(queryClient, post.id, true),
      scope: identityScope,
    }),
  );
  const deleteMutate = useMutation(
    orpc.like.deleteLike.mutationOptions(likeMutationHandlers(queryClient, post.id, false)),
  );
  const mutationPending = createMutate.isPending || deleteMutate.isPending;
  const { isLiked, likeCount } = post;

  const toggleLike = () => {
    if (!post.id) {
      return;
    }

    if (isLiked) {
      deleteMutate.mutate({ postId: post.id });
    } else {
      setIsAnimating(true);
      createMutate.mutate({ postId: post.id });
    }
  };

  return (
    <button
      type="button"
      disabled={mutationPending}
      className="hover:bg-accent relative flex h-8 cursor-pointer items-center gap-1.5 rounded-lg p-2 transition"
      onClick={toggleLike}
    >
      <div className="relative">
        {isAnimating && <CircleAnimation />}
        {isAnimating && <BurstAnimation />}
        {isAnimating ? (
          <m.svg
            key="animating-heart"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              damping: 10,
              delay: 0.3,
              stiffness: 300,
              type: "spring",
            }}
            onAnimationComplete={() => setIsAnimating(false)}
            className="text-red-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z" />
          </m.svg>
        ) : (
          <svg
            className={`${isLiked ? "text-red-500" : "text-inherit"}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z" />
          </svg>
        )}
      </div>
      <span className="min-w-[0.75rem]">
        <NumberFlow value={likeCount} />
        <span className="sr-only"> likes, click to {isLiked ? "unlike" : "like"}</span>
      </span>
    </button>
  );
};
