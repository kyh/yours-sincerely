import { POST_EXPIRY_DAYS_AGO } from "@init/api/post/post-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@init/ui/tooltip";
import { addDays, formatDistance } from "date-fns";

import type { RouterOutputs } from "@init/api";

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
  post: RouterOutputs["post"]["byId"];
};

export const Timer = ({ post }: Props) => {
  if (!post?.createdAt) return null;

  const { percentage, now, end } = getPercentage(new Date(post.createdAt));
  const formattedTime = formatDistance(now, end);

  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center rounded-lg p-2" asChild>
        <div
          className="relative inline-block h-4 w-4 rounded-full bg-slate-400 bg-[length:150%] bg-center	bg-blend-overlay"
          style={{
            backgroundImage: `conic-gradient(
          rgba(255, 255, 255, 0.6) calc(3.6deg * ${percentage}),
          rgba(0, 0, 0, 0) calc(3.6deg * ${percentage})
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
