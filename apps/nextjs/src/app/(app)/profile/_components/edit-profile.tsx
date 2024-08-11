"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@init/ui/button";
import { toast } from "@init/ui/toast";

import { api } from "@/trpc/react";
import { CalendarMenu } from "./calendar-menu";
import { CALENDAR_LABELS, DEFAULT_WEEKDAY_LABELS } from "./calendar-util";

export const EditProfile = ({ id }: { id: string }) => {
  const utils = api.useUtils();
  const [user] = api.user.byId.useSuspenseQuery({ id: id });

  const router = useRouter();
  const mutation = api.user.update.useMutation();
  const [recurring, setRecurring] = useState<string[]>([]);

  const handleRecurringDayChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const includes = recurring.includes(event.target.value);
    setRecurring(
      includes
        ? recurring.filter((day) => day !== event.target.value)
        : [...recurring, event.target.value],
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const input = Object.fromEntries(data) as {
      displayName: string;
      displayImage: string;
      email: string;
      weeklyDigestEmail: string;
    };

    mutation.mutate({
      ...input,
      email: input.email,
      displayName: input.displayName,
      displayImage: input.displayImage,
      weeklyDigestEmail:
        (input.weeklyDigestEmail as unknown as string) === "true",
      id: user.id,
    });

    toast("User profile updated");

    await utils.account.byId.invalidate({ id });
    await utils.account.me.invalidate();

    router.push(`/profile/${user.id}`);
  };

  return (
    <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
      <fieldset className="flex flex-col gap-5">
        <h1 className="text-xl font-bold">Profile Details</h1>
        <input
          id="displayName"
          name="displayName"
          className="text-2xl font-bold"
          defaultValue={user.displayName ?? ""}
          placeholder="Anonymous"
        />
        <input
          id="email"
          name="email"
          className="text-2xl font-bold"
          placeholder="your@mail.com"
          defaultValue={user.email ?? ""}
        />
      </fieldset>
      <fieldset className="flex flex-col">
        <h1 className="text-xl font-bold">Notifications</h1>
        <dl className="divide-y divide-slate-200 dark:divide-slate-500">
          <div className="py-4 sm:py-5">
            <div className="items-top flex justify-between">
              <dt className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-100">
                Set up writing reminders
              </dt>
              <dd>
                <CalendarMenu text="Add Reminder" recurring={recurring} />
              </dd>
            </div>
            <div className="mt-3 flex w-full flex-wrap justify-center gap-2 sm:justify-evenly sm:gap-0">
              {DEFAULT_WEEKDAY_LABELS.map((day) => (
                <label key={day} className="cursor-pointer text-center">
                  <input
                    className="peer hidden"
                    type="checkbox"
                    name={`reminder-${day}`}
                    id={`reminder-${day}`}
                    value={CALENDAR_LABELS[day as keyof typeof CALENDAR_LABELS]}
                    checked={recurring.includes(
                      CALENDAR_LABELS[day as keyof typeof CALENDAR_LABELS],
                    )}
                    onChange={handleRecurringDayChange}
                  />
                  <div className="w-14 rounded-full bg-slate-200 px-3 pb-3 pt-10 transition peer-checked:bg-primary peer-checked:text-slate-50 dark:bg-slate-600">
                    {day}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </dl>
      </fieldset>
      <div className="flex items-center justify-between gap-2">
        <button
          className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-sm leading-4 text-red-700 transition hover:bg-red-50 dark:text-red-500 dark:hover:bg-transparent dark:hover:text-red-700"
          onClick={async (e) => {
            e.preventDefault();
          }}
        >
          Logout
        </button>
        <div className="flex gap-2">
          <Button variant="link" asChild>
            <Link href={`/profile/${user.id}`}>Back</Link>
          </Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </form>
  );
};
