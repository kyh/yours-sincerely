import { useState, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, FormMethod } from "remix";
import { User } from "~/lib/user/data/userSchema";
import { Post } from "~/lib/post/data/postSchema";

let mojs: any;

const getMojs = () => {
  if (!mojs) mojs = require("@mojs/core");
  return mojs;
};

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
  replay: () => {};
  play: (_step: number) => {};
};

const useHeartAnimation = (
  enabled: boolean,
  iconRef: any,
  iconButtonRef: any
) => {
  const [initialized, setInitialized] = useState(false);
  const heart = useRef<null | MojsRef>(null);
  const circle = useRef<null | MojsRef>(null);
  const burst = useRef<null | MojsRef>(null);

  const playAnimation = () => {
    if (!enabled) return;
    heart?.current?.replay();
    burst?.current?.replay();
    circle?.current?.replay();
  };

  useEffect(() => {
    if (!enabled) return;
    if (!initialized && iconRef.current && iconButtonRef.current) {
      getMojs();
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
  }, [iconRef, iconButtonRef]);

  return playAnimation;
};

type Props = {
  post: Post;
};

type LoaderData = {
  user: User | null;
};

export const LikeButton = ({ post }: Props) => {
  const { user } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const iconRef = useRef<null | SVGSVGElement>(null);
  const iconButtonRef = useRef<null | HTMLButtonElement>(null);
  const playAnimation = useHeartAnimation(!!user, iconRef, iconButtonRef);

  const toggleLike = async () => {
    let method: FormMethod = "delete";
    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
    } else {
      method = "post";
      setLikeCount(likeCount + 1);
      playAnimation();
      setIsLiked(true);
    }

    fetcher.submit(null, { method, action: `/posts/${post.id}/like` });
  };

  return (
    <button
      ref={iconButtonRef}
      type="button"
      className="relative flex gap-2 items-center p-2 rounded-lg transition hover:bg-slate-100 disabled:hover:bg-transparent dark:hover:bg-slate-700"
      onClick={toggleLike}
      disabled={!user}
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
      <span className="min-w-[0.75rem]">{likeCount}</span>
    </button>
  );
};

export default LikeButton;
