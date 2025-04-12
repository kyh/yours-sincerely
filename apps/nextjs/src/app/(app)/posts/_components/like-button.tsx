"use client";

import { useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";

import type { RouterOutputs } from "@kyh/api";
import { useTRPC } from "@/trpc/react";

const CircleAnimation = () => {
  const CIRCLE_RADIUS = 20;

  return (
    <svg
      className="pointer-events-none absolute -top-3 -left-3"
      style={{
        width: CIRCLE_RADIUS * 2,
        height: CIRCLE_RADIUS * 2,
      }}
    >
      <motion.circle
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
          ease: [0.33, 1, 0.68, 1], // cubic-out
        }}
      />
    </svg>
  );
};

// Burst animation with particles
const BurstAnimation = () => {
  // Colors for particles with from/to transitions
  const colorPairs = [
    { from: "#9EC9F5", to: "#9ED8C6" },
    { from: "#91D3F7", to: "#9AE4CF" },
    { from: "#DC93CF", to: "#E3D36B" },
    { from: "#CF8EEF", to: "#CBEB98" },
    { from: "#87E9C6", to: "#1FCC93" },
    { from: "#A7ECD0", to: "#9AE4CF" },
    { from: "#87E9C6", to: "#A635D9" },
    { from: "#D58EB3", to: "#E0B6F5" },
    { from: "#F48BA2", to: "#CF8EEF" },
    { from: "#91D3F7", to: "#A635D9" },
    { from: "#CF8EEF", to: "#CBEB98" },
    { from: "#87E9C6", to: "#A635D9" },
    { from: "#9EC9F5", to: "#9ED8C6" },
    { from: "#91D3F7", to: "#9AE4CF" },
  ];

  return (
    <div className="pointer-events-none absolute -top-3 -left-3 grid size-10 place-items-center">
      {colorPairs.map((colors, index) => (
        <Particle
          key={index}
          fromColor={colors.from}
          toColor={colors.to}
          index={index}
          totalParticles={colorPairs.length}
        />
      ))}
    </div>
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

  // Add randomness to the burst distance (±15%)
  const randomFactor = 0.85 + Math.random() * 0.3;
  const burstDistance = BURST_RADIUS * randomFactor;

  // Randomize duration between 500-700ms
  const duration = 500 + Math.random() * 200;

  // Calculate the degree shift (13 degrees in radians)
  const degreeShift = (13 * Math.PI) / 180;

  return (
    <motion.div
      className="pointer-events-none absolute size-1.5 rounded-full"
      style={{ backgroundColor: fromColor, opacity: 0 }}
      initial={{
        opacity: 0,
        scale: 1,
        x: Math.cos(radians) * START_RADIUS * PATH_SCALE_FACTOR,
        y: Math.sin(radians) * START_RADIUS * PATH_SCALE_FACTOR,
        backgroundColor: fromColor,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: Math.cos(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
        y: Math.sin(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
        scale: 0,
        backgroundColor: toColor,
      }}
      transition={{
        opacity: {
          times: [0, 0.01, 0.99, 1],
          duration: duration / 1000,
          delay: 0.4,
        },
        x: {
          duration: duration / 1000,
          ease: [0.23, 1, 0.32, 1], // quint.out for movement
          delay: 0.3,
        },
        y: {
          duration: duration / 1000,
          ease: [0.23, 1, 0.32, 1], // quint.out for movement
          delay: 0.3,
        },
        scale: {
          duration: duration / 1000,
          ease: [0.55, 0.085, 0.68, 0.53], // quad.in for scaling
          delay: 0.3,
        },
        backgroundColor: {
          duration: duration / 1000,
          delay: 0.3,
        },
      }}
    />
  );
};

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const LikeButton = ({ post }: Props) => {
  const trpc = useTRPC();
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const iconButtonRef = useRef<null | HTMLButtonElement>(null);

  const createMutate = useMutation(trpc.like.createLike.mutationOptions());
  const deleteMutate = useMutation(trpc.like.deleteLike.mutationOptions());

  const toggleLike = () => {
    if (!post.id) return;

    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
      deleteMutate.mutate({ postId: post.id });
    } else {
      setLikeCount(likeCount + 1);
      setIsLiked(true);
      setIsAnimating(true);
      createMutate.mutate({ postId: post.id });
    }
  };

  return (
    <button
      ref={iconButtonRef}
      type="button"
      className="hover:bg-accent relative flex h-8 cursor-pointer items-center gap-1.5 rounded-lg p-2 transition"
      onClick={toggleLike}
    >
      <div className="relative">
        {isAnimating && <CircleAnimation />}
        {isAnimating && <BurstAnimation />}
        {isAnimating ? (
          <motion.svg
            key="animating-heart"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 10,
              delay: 0.3,
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
          </motion.svg>
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
        <span className="sr-only">
          {" "}
          likes, click to {isLiked ? "unlike" : "like"}
        </span>
      </span>
    </button>
  );
};
