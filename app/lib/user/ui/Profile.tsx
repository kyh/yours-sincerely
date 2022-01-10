import { Link, Form, useTransition } from "remix";
import {
  ActivityCalendar,
  ActivityWeek,
  Day,
  fullDayLabel,
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

export const Profile = ({ user, stats, showEdit }: Props) => {
  const transition = useTransition();

  return (
    <section className="flex flex-col max-w-lg gap-8 mx-auto">
      <h1 className="text-3xl font-bold">
        {user.displayName}{" "}
        {showEdit && (
          <Link className="text-sm font-normal" to={`/${user.id}/edit`}>
            Edit
          </Link>
        )}
      </h1>
      <ActivityCalendar data={stats.heatmap.stats} />
      <div>
        <h2 className="font-bold text-sm">
          Favorite day to write is on{" "}
          <span className="text-primary">
            {fullDayLabel[stats.daily.max.day as keyof typeof fullDayLabel]}s
          </span>
        </h2>
        <ActivityWeek data={stats.daily.stats} />
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
