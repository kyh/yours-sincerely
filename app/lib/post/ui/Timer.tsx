import { addDays, formatDistance } from "date-fns";
import { Post, POST_EXPIRY_DAYS_AGO } from "~/lib/post/data/postSchema";
import { Tooltip } from "~/lib/core/ui/Tooltip";

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
        100
    ),
  };
};

type Props = {
  post: Post;
};

export const Timer = ({ post }: Props) => {
  const { percentage, now, end } = getPercentage(new Date(post.createdAt!));
  return (
    <Tooltip
      buttonClassName="flex items-center p-2 rounded-lg"
      buttonContent={
        <div
          className="relative inline-block bg-slate-400 bg-blend-overlay w-4 h-4 rounded-full bg-center	bg-[length:150%]"
          style={{
            backgroundImage: `conic-gradient(
          rgba(255, 255, 255, 0.6) calc(3.6deg * ${percentage}),
          rgba(0, 0, 0, 0) calc(3.6deg * ${percentage})
        )`,
          }}
          data-percentage={percentage}
        />
      }
      panelContent={`Dissapears in ${formatDistance(now, end)}`}
    />
  );
};
