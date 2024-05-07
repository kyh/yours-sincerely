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
          : "rounded-lg bg-white shadow-lg dark:bg-slate-900 sm:grid sm:grid-cols-3"
      }
    >
      <div
        className={
          stack
            ? "flex flex-col p-2 text-center"
            : "flex flex-col border-b border-slate-100 p-4 text-center dark:border-slate-800 sm:border-0 sm:border-r"
        }
      >
        <dt
          className={`order-2 font-medium leading-6 text-slate-500 dark:text-slate-300 ${stack ? "text-xs" : "text-sm"
            }`}
        >
          Current Streak
        </dt>
        <dd
          className={`order-1 text-xl font-extrabold text-primary-dark dark:text-primary`}
        >
          {data.currentStreak}
        </dd>
      </div>
      <div
        className={
          stack
            ? "flex flex-col p-2 text-center"
            : "flex flex-col border-t border-b border-slate-100 p-4 text-center dark:border-slate-800 sm:border-0 sm:border-l sm:border-r"
        }
      >
        <dt
          className={`order-2 font-medium leading-6 text-slate-500 dark:text-slate-300 ${stack ? "text-xs" : "text-sm"
            }`}
        >
          Longest Streak
        </dt>
        <dd
          className={`order-1 text-xl font-extrabold text-primary-dark dark:text-primary`}
        >
          {data.longestStreak}
        </dd>
      </div>
      <div
        className={
          stack
            ? "flex flex-col p-2 text-center"
            : "flex flex-col border-t border-slate-100 p-4 text-center dark:border-slate-800 sm:border-0 sm:border-l"
        }
      >
        <dt
          className={`order-2 font-medium leading-6 text-slate-500 dark:text-slate-300 ${stack ? "text-xs" : "text-sm"
            }`}
        >
          Total Posts
        </dt>
        <dd
          className={`order-1 text-xl font-extrabold text-primary-dark dark:text-primary`}
        >
          {data.posts}
        </dd>
      </div>
    </dl>
  );
};
