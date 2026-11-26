"use client";

import { useState } from "react";
import { LIKE_BURST_COLOR_PAIRS } from "@repo/contract/content";
import { createLikeMutationHandlers } from "@repo/contract/like-cache";
import { toast } from "@repo/ui/components/sonner";
import NumberFlow from "@number-flow/react";
import { ORPCError } from "@orpc/client";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "motion/react";

import type { FeedPost, RouterOutputs } from "@repo/contract";
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
          ease: [0.33, 1, 0.68, 1],
        }}
      />
    </svg>
  );
};

const BURST_RADIUS = 32;
const START_RADIUS = 4;
const PATH_SCALE_FACTOR = 0.8;

interface ParticleSpread {
  colors: (typeof LIKE_BURST_COLOR_PAIRS)[number];
  duration: number;
  randomFactor: number;
}

const spreadBurst = () =>
  LIKE_BURST_COLOR_PAIRS.map<ParticleSpread>((colors) => ({
    colors,
    duration: 500 + Math.random() * 200,
    randomFactor: 0.85 + Math.random() * 0.3,
  }));

const Particle = ({
  fromColor,
  toColor,
  index,
  totalParticles,
  randomFactor,
  duration,
}: {
  fromColor: string;
  toColor: string;
  index: number;
  totalParticles: number;
  randomFactor: number;
  duration: number;
}) => {
  const angle = (index / totalParticles) * 360 + 45;
  const radians = (angle * Math.PI) / 180;

  const burstDistance = BURST_RADIUS * randomFactor;

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
          ease: [0.55, 0.085, 0.68, 0.53],
        },
        x: {
          delay: 0.3,
          duration: duration / 1000,
          ease: [0.23, 1, 0.32, 1],
        },
        y: {
          delay: 0.3,
          duration: duration / 1000,
          ease: [0.23, 1, 0.32, 1],
        },
      }}
    />
  );
};

const BurstAnimation = ({ spreads }: { spreads: ParticleSpread[] }) => (
  <div className="pointer-events-none absolute -top-3 -left-3 grid size-10 place-items-center">
    {spreads.map(({ colors, duration, randomFactor }, index) => (
      <Particle
        key={colors.id}
        fromColor={colors.from}
        toColor={colors.to}
        index={index}
        totalParticles={spreads.length}
        randomFactor={randomFactor}
        duration={duration}
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
      refresh: () => {
        void markPostContentStale(queryClient);
        void refreshWorkspaceIdentityIfAnonymous(queryClient);
      },
      writeFeed: (queryKey, data) => {
        queryClient.setQueryData(queryKey, data);
      },
      writePost: (queryKey, data) => {
        queryClient.setQueryData(queryKey, data);
      },
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
        void refreshPostContent(queryClient);

        return;
      }

      toast.error("Could not update this like. Please try again.");
    },
  };
};

export const LikeButton = ({ post }: Props) => {
  const queryClient = useQueryClient();
  const [burst, setBurst] = useState<ParticleSpread[] | null>(null);

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
      setBurst(spreadBurst());
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
        {burst !== null && <CircleAnimation />}
        {burst !== null && <BurstAnimation spreads={burst} />}
        {burst === null ? (
          <svg
            className={isLiked ? "text-red-500" : "text-inherit"}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z" />
          </svg>
        ) : (
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
            onAnimationComplete={() => {
              setBurst(null);
            }}
            className="text-red-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z" />
          </m.svg>
        )}
      </div>
      <span className="min-w-[0.75rem]">
        <NumberFlow value={likeCount} />
        <span className="sr-only"> likes, click to {isLiked ? "unlike" : "like"}</span>
      </span>
    </button>
  );
};
