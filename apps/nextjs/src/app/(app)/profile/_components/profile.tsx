"use client";

import Link from "next/link";
import { updateUserInput } from "@init/api/user/user-schema";
import { Button } from "@init/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@init/ui/form";
import { Input } from "@init/ui/input";
import { useTheme } from "@init/ui/theme";
import { toast } from "@init/ui/toast";

import type { RouterOutputs } from "@init/api";
import type { UpdateUserInput } from "@init/api/user/user-schema";
import { api } from "@/trpc/react";
import { ActivityCalendar } from "./activity-calendar";
import { ActivityStats } from "./activity-stats";
import { ActivityWeek } from "./activity-week";
import { FULL_DAY_LABELS } from "./calendar-util";

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

type User = NonNullable<RouterOutputs["user"]["getUser"]["user"]>;

type ProfileProps = {
  userId: string;
};

export const Profile = ({ userId }: ProfileProps) => {
  const [{ user }] = api.user.getUser.useSuspenseQuery({ userId });
  const [{ user: currentUser }] = api.auth.workspace.useSuspenseQuery();
  // const [posts] = api.post.getPostAll.useSuspenseQuery({ userId: id });

  if (!user) {
    return <ProfileNotFound />;
  }

  const allowEdit = currentUser ? currentUser.id === user.id : false;
  let content = null;

  if (allowEdit) {
    content = <ProfileEditForm user={user} />;
  }
  // const lastNDays = 200;

  // const stats = {
  //   heatmap: createPostsHeatmap(posts, lastNDays),
  //   daily: createPostsDailyActivity(posts),
  //   posts: getTotalPosts(posts),
  //   likes: getTotalLikes(posts),
  //   longestStreak: getLongestStreak(posts),
  //   currentStreak: getCurrentStreak(posts),
  // };

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <section className="flex flex-col gap-8">
      {content}
      {/* <ActivityStats
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
      </div> */}
    </section>
  );
};

const ProfileNotFound = () => {
  return <h1>Hmm, can't seem to find the person you're looking for</h1>;
};

const ProfileEditForm = ({ user }: { user: User }) => {
  const updateUser = api.user.updateUser.useMutation();

  const form = useForm({
    schema: updateUserInput,
    defaultValues: {
      userId: user.id,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
    },
  });

  const onSubmit = (data: UpdateUserInput) => {
    const promise = updateUser.mutateAsync(data);
    toast.promise(promise, {
      loading: "Updating profile...",
      success: "Profile successfully updated",
      error: "Could not update profile. Please try again.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email" {...field} />
              </FormControl>
              <FormDescription>
                Register an email to recover your account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <footer className="flex justify-end">
          <Button type="submit" loading={updateUser.isPending}>
            Update Profile
          </Button>
        </footer>
      </form>
    </Form>
  );
};
