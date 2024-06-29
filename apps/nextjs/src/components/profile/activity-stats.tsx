type Props = {
  stack?: boolean;
  data: {
    posts: number;
    likes: number;
    currentStreak: number;
    longestStreak: number;
  };
};

export const ActivityStats = ({ data, stack = false }: Props) => {
  return (
    <dl
      className={
        stack
          ? "grid grid-cols-2"
          : "rounded-lg shadow-lg sm:grid sm:grid-cols-3"
      }
    >
      <div
        className={
          stack
            ? "flex flex-col p-2 text-center"
            : "flex flex-col border-b border-border p-4 text-center sm:border-0 sm:border-r"
        }
      >
        <dt
          className={`order-2 font-medium leading-6 ${
            stack ? "text-xs" : "text-sm"
          }`}
        >
          Current Streak
        </dt>
        <dd className="order-1 text-xl font-extrabold">{data.currentStreak}</dd>
      </div>
      <div
        className={
          stack
            ? "flex flex-col p-2 text-center"
            : "flex flex-col border-b border-t border-border p-4 text-center sm:border-0 sm:border-l sm:border-r"
        }
      >
        <dt
          className={`order-2 font-medium leading-6 ${
            stack ? "text-xs" : "text-sm"
          }`}
        >
          Longest Streak
        </dt>
        <dd className="order-1 text-xl font-extrabold">{data.longestStreak}</dd>
      </div>
      <div
        className={
          stack
            ? "flex flex-col p-2 text-center"
            : "flex flex-col border-t border-border p-4 text-center sm:border-0 sm:border-l"
        }
      >
        <dt
          className={`order-2 font-medium leading-6 ${
            stack ? "text-xs" : "text-sm"
          }`}
        >
          Total Posts
        </dt>
        <dd className="order-1 text-xl font-extrabold">{data.posts}</dd>
      </div>
    </dl>
  );
};
