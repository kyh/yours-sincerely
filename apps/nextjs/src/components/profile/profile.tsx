"use client";

import Link from "next/link";
import { useTheme } from "@init/ui/theme";

import type { Day } from "@/app/_components/activity";
import type { User } from "@init/api/lib/user-schema";
import {
  ActivityCalendar,
  ActivityStats,
  ActivityWeek,
  FULL_DAY_LABELS,
} from "@/app/_components/activity";

type Props = {
  user: User;
  showEdit: boolean;
  stats: {
    heatmap: { stats: Day[]; max: number };
    daily: {
      stats: Record<string, { count: number; level: number }>;
      max: { max: number; day: string };
    };
    posts: number;
    likes: number;
    currentStreak: number;
    longestStreak: number;
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

// const Loading = () => {
//   return (
//     <div className="animate-pulse">
//       <div className="h-[84px] rounded bg-slate-200 dark:bg-slate-700" />
//       <div className="mt-8 h-[120px] rounded bg-slate-200 dark:bg-slate-700" />
//       <div className="mt-2 h-[20px]  rounded bg-slate-200 dark:bg-slate-700" />
//       <div className="mt-8 h-[20px]  rounded bg-slate-200 dark:bg-slate-700" />
//       <div className="mt-2 h-[90px]  rounded bg-slate-200 dark:bg-slate-700" />
//     </div>
//   );
// };

export const Profile = ({ user, stats, showEdit }: Props) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {user.displayName ?? "Anonymous"}{" "}
        </h1>
        {showEdit && (
          <Link className="text-sm font-normal" href={`/edit/${user.id}`}>
            Edit
          </Link>
        )}
      </div>
      <>
        <ActivityStats
          data={{
            posts: stats.posts,
            likes: stats.likes,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
          }}
        />
        <ActivityCalendar
          data={stats.heatmap.stats}
          theme={isDarkMode ? darkTheme : lightTheme}
        />
        <div>
          <h2 className="text-sm font-bold">
            {stats.daily.max.day === "none" ? (
              <>No daily stats yet</>
            ) : (
              <>
                Favorite day to write is on{" "}
                <span className="text-primary">
                  {
                    FULL_DAY_LABELS[
                      stats.daily.max.day as keyof typeof FULL_DAY_LABELS
                    ]
                  }
                  s
                </span>
              </>
            )}
          </h2>
          <ActivityWeek
            data={stats.daily.stats}
            theme={isDarkMode ? darkTheme : lightTheme}
          />
        </div>
      </>
      {/* )}
      </ClientOnly> */}
    </section>
  );
};
