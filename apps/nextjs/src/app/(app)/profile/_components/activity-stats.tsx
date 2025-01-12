type Props = {
  data: {
    posts: number;
    likes: number;
    currentStreak: number;
    longestStreak: number;
  };
  stack?: boolean;
};

export const ActivityStats = ({ data, stack }: Props) => {
  return (
    <dl className={`grid gap-2 ${stack ? "grid-cols-2" : "grid-cols-4"}`}>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs not-italic text-muted-foreground">
          🔥 Current Streak
        </dt>
        <dd className="order-1 text-lg font-extrabold">{data.currentStreak}</dd>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs not-italic text-muted-foreground">
          ✍️ Longest Streak
        </dt>
        <dd className="order-1 text-lg font-extrabold">{data.longestStreak}</dd>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs not-italic text-muted-foreground">
          💯 Total Posts
        </dt>
        <dd className="order-1 text-lg font-extrabold">{data.posts}</dd>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs not-italic text-muted-foreground">
          💖 Total Likes
        </dt>
        <dd className="order-1 text-lg font-extrabold">{data.likes}</dd>
      </div>
    </dl>
  );
};
