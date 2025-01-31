type Props = {
  posts: number;
  likes: number;
  currentStreak: number;
  longestStreak: number;
};

export const ActivityStats = ({
  posts,
  likes,
  currentStreak,
  longestStreak,
}: Props) => {
  return (
    <dl className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs text-muted-foreground">
          Current Streak
        </dt>
        <dd className="order-1 text-lg font-extrabold">{currentStreak}</dd>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs text-muted-foreground">
          Longest Streak
        </dt>
        <dd className="order-1 text-lg font-extrabold">{longestStreak}</dd>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs text-muted-foreground">Total Posts</dt>
        <dd className="order-1 text-lg font-extrabold">{posts}</dd>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <dt className="order-2 text-xs text-muted-foreground">Total Likes</dt>
        <dd className="order-1 text-lg font-extrabold">{likes}</dd>
      </div>
    </dl>
  );
};
