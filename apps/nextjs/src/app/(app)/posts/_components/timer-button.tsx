"use client";

import { useState } from "react";
import { POST_EXPIRY_DAYS_AGO } from "@repo/api/post/post-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip";
import { addDays, formatDistance } from "date-fns";

import type { RouterOutputs } from "@repo/api";

const getPercentage = (createdAt: Date) => {
  const now = new Date();
  const start = createdAt;
  const end = addDays(createdAt, POST_EXPIRY_DAYS_AGO);
  return {
    now,
    start,
    end,
    percentage: Math.round(
      ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) *
        100,
    ),
  };
};

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const TimerButton = ({ post }: Props) => {
  const [open, setOpen] = useState(false);

  if (!post.createdAt) return null;

  const start = new Date(post.createdAt);
  const { percentage, now, end } = getPercentage(start);
  const formattedTime = formatDistance(now, end);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        className="hover:bg-accent grid size-8 cursor-pointer place-items-center rounded-lg p-2 transition"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <div
          className="relative inline-block h-4 w-4 rounded-full bg-[length:150%] bg-center bg-blend-overlay"
          style={{
            backgroundImage: `conic-gradient(
              rgba(120, 120, 120, 0.1) calc(3.6deg * ${percentage}),
              rgba(120, 120, 120, 0.5) calc(3.6deg * ${percentage})
            )`,
          }}
          data-percentage={percentage}
        >
          <span className="sr-only">Content dissapears in {formattedTime}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Dissapears in {formattedTime}</TooltipContent>
    </Tooltip>
  );
};
