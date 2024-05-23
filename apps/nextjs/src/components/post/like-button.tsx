/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
"use client";

import { useEffect, useRef, useState } from "react";
import mojs from "@mojs/core";

import type { RouterOutputs } from "@init/api";
import { api } from "@/trpc/react";

const createHeartAnimation = (el: HTMLElement) => {
  return new mojs.Html({
    el,
    scale: { 0: 1 },
    easing: "elastic.out",
    duration: 1000,
    delay: 300,
    radius: 11,
    isShowStart: false,
  }).play(1000);
};

const CIRCLE_RADIUS = 20;
const createCircleAnimation = (el: HTMLElement) => {
  return new mojs.Shape({
    parent: el,
    className: "pointer-events-none",
    left: 16,
    stroke: { "#E5214A": "#CC8EF5" },
    strokeWidth: { [2 * CIRCLE_RADIUS]: 0 },
    fill: "none",
    scale: { 0: 1 },
    radius: CIRCLE_RADIUS,
    duration: 400,
    easing: "cubic.out",
  });
};

const BURST_RADIUS = 32;
const createBurstAnimation = (el: HTMLElement) => {
  return new mojs.Burst({
    parent: el,
    className: "pointer-events-none",
    left: 16,
    radius: { 4: BURST_RADIUS },
    angle: 45,
    count: 14,
    timeline: { delay: 300 },
    children: {
      radius: 2.5,
      fill: [
        { "#9EC9F5": "#9ED8C6" },
        { "#91D3F7": "#9AE4CF" },
        { "#DC93CF": "#E3D36B" },
        { "#CF8EEF": "#CBEB98" },
        { "#87E9C6": "#1FCC93" },
        { "#A7ECD0": "#9AE4CF" },
        { "#87E9C6": "#A635D9" },
        { "#D58EB3": "#E0B6F5" },
        { "#F48BA2": "#CF8EEF" },
        { "#91D3F7": "#A635D9" },
        { "#CF8EEF": "#CBEB98" },
        { "#87E9C6": "#A635D9" },
      ],
      scale: { 1: 0, easing: "quad.in" },
      pathScale: [0.8, null],
      degreeShift: [13, null],
      duration: [500, 700],
      easing: "quint.out",
    },
  });
};

type MojsRef = HTMLElement & {
  replay: () => Record<string, never>;
  play: (_step: number) => Record<string, never>;
};

const useHeartAnimation = (iconRef: any, iconButtonRef: any) => {
  const [initialized, setInitialized] = useState(false);
  const heart = useRef<null | MojsRef>(null);
  const circle = useRef<null | MojsRef>(null);
  const burst = useRef<null | MojsRef>(null);

  const playAnimation = () => {
    heart.current?.replay();
    burst.current?.replay();
    circle.current?.replay();
  };

  useEffect(() => {
    if (!initialized && iconRef.current && iconButtonRef.current) {
      // weird bug where .play initialization sometimes fails
      heart.current = heart.current
        ? heart.current.play(1000)
        : createHeartAnimation(iconRef.current);

      circle.current =
        circle.current || createCircleAnimation(iconButtonRef.current);

      burst.current =
        burst.current || createBurstAnimation(iconButtonRef.current);

      setInitialized(true);
    }
  }, [iconRef, iconButtonRef, initialized]);

  return playAnimation;
};

type Props = {
  post: RouterOutputs["posts"]["byId"];
};

const LikeButton = ({ post }: Props) => {
  const [likeCount, setLikeCount] = useState(post?.likeCount ?? 0);
  const [isLiked, setIsLiked] = useState(post?.isLiked ?? false);
  const iconRef = useRef<null | SVGSVGElement>(null);
  const iconButtonRef = useRef<null | HTMLButtonElement>(null);
  const playAnimation = useHeartAnimation(iconRef, iconButtonRef);

  const createMutate = api.like.create.useMutation();
  const deleteMutate = api.like.delete.useMutation();

  const toggleLike = async () => {
    if (!post?.id) return;
    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
      deleteMutate.mutate({ id: post.id });
    } else {
      setLikeCount(likeCount + 1);
      playAnimation();
      setIsLiked(true);
      createMutate.mutate({ postId: post.id });
    }
  };

  return (
    <button
      ref={iconButtonRef}
      type="button"
      className="relative flex items-center gap-2 rounded-lg p-2 transition hover:bg-slate-100 disabled:hover:bg-transparent dark:hover:bg-slate-700"
      onClick={toggleLike}
    >
      <svg
        className={`${isLiked ? "text-red-500" : "text-slate-400"}`}
        ref={iconRef}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="currentColor"
      >
        <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z" />
      </svg>
      <span className="min-w-[0.75rem]">
        {likeCount}
        <span className="sr-only">
          {" "}
          likes, click to {isLiked ? "like" : "unlike"}
        </span>
      </span>
    </button>
  );
};

export default LikeButton;
