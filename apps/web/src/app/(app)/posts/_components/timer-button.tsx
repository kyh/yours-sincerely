"use client";

import { getExpiryProgress } from "@repo/contracts/content";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { formatDistance } from "date-fns";

import type { FeedPost } from "@repo/api";

interface Props {
  post: FeedPost;
}

export const TimerButton = ({ post }: Props) => {
  if (!post.createdAt) {
    return null;
  }

  const { percentage, end, isExpired } = getExpiryProgress(post.createdAt);
  const formattedTime = isExpired ? "Expired" : `Disappears in ${formatDistance(new Date(), end)}`;

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        className="hover:bg-accent grid size-8 cursor-pointer place-items-center rounded-lg p-2 transition"
      >
        <span
          className="relative inline-block h-4 w-4 rounded-full bg-[length:150%] bg-center bg-blend-overlay"
          style={{
            backgroundImage: `conic-gradient(
              rgba(120, 120, 120, 0.1) calc(3.6deg * ${percentage}),
              rgba(120, 120, 120, 0.5) calc(3.6deg * ${percentage})
            )`,
          }}
          data-percentage={percentage}
        >
          <span className="sr-only">{formattedTime}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-fit px-3 py-1.5 text-xs">
        {formattedTime}
      </PopoverContent>
    </Popover>
  );
};
