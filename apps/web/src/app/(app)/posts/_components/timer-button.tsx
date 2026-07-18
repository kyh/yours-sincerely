"use client";

import { useState } from "react";
import { getExpiryProgress } from "@repo/contracts/content";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { formatDistance } from "date-fns";

import type { RouterOutputs } from "@repo/api";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const TimerButton = ({ post }: Props) => {
  const [open, setOpen] = useState(false);

  if (!post.createdAt) return null;

  const { percentage, end, isExpired } = getExpiryProgress(post.createdAt);
  const formattedTime = isExpired ? "Expired" : `Dissapears in ${formatDistance(new Date(), end)}`;

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
          <span className="sr-only">{formattedTime}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{formattedTime}</TooltipContent>
    </Tooltip>
  );
};
