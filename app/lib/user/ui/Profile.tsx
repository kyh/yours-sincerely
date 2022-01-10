import { Link, Form, useTransition } from "remix";
import { useTheme } from "~/lib/core/ui/Theme";
import {
  ActivityCalendar,
  ActivityWeek,
  Day,
  FULL_DAY_LABELS,
} from "~/lib/core/ui/Activity";
import { User } from "~/lib/user/data/userSchema";

type Props = {
  user: User;
  showEdit: boolean;
  stats: {
    heatmap: { stats: Day[]; max: number };
    daily: {
      stats: Record<string, { count: number; level: number }>;
      max: { max: number; day: string };
    };
  };
};

const lightTheme = {
  level4: "#312e81",
  level3: "#4338ca",
  level2: "#6366f1",
  level1: "#a5b4fc",
  level0: "#e0e7ff",
  stroke: "#ddd6fe",
};

const darkTheme = {
  level4: "#6366f1",
  level3: "#4f46e5",
  level2: "#4338ca",
  level1: "#3730a3",
  level0: "#272567",
  stroke: "#312e81",
};

export const Profile = ({ user, stats, showEdit }: Props) => {
  const transition = useTransition();
  const { isDarkMode } = useTheme();

  return (
    <section className="flex flex-col max-w-lg gap-8 mx-auto">
      <h1 className="text-3xl font-bold">
        {user.displayName || "Anonymous"}{" "}
        {showEdit && (
          <Link className="text-sm font-normal" to={`/${user.id}/edit`}>
            Edit
          </Link>
        )}
      </h1>
      <ActivityCalendar
        data={stats.heatmap.stats}
        theme={isDarkMode ? darkTheme : lightTheme}
      />
      <div>
        <h2 className="font-bold text-sm">
          Favorite day to write is on{" "}
          <span className="text-primary">
            {
              FULL_DAY_LABELS[
                stats.daily.max.day as keyof typeof FULL_DAY_LABELS
              ]
            }
            s
          </span>
        </h2>
        <ActivityWeek
          data={stats.daily.stats}
          theme={isDarkMode ? darkTheme : lightTheme}
        />
      </div>
      {showEdit && (
        <Form
          className="flex justify-center"
          action="/auth/logout"
          method="post"
        >
          <button
            className="inline-flex items-center justify-center px-3 py-2 text-sm leading-4 text-red-700 transition border border-transparent rounded-md hover:bg-red-50 dark:text-red-500 dark:hover:bg-transparent dark:hover:text-red-300"
            type="submit"
            disabled={transition.state === "submitting"}
          >
            Logout
          </button>
        </Form>
      )}
    </section>
  );
};
