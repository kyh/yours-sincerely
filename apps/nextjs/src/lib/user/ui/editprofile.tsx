"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Switch } from "@headlessui/react";
import { toast } from "@init/ui/toast";

import type { User } from "../data/userSchema";
import {
  CALENDAR_LABELS,
  DEFAULT_WEEKDAY_LABELS,
} from "@/app/_components/activity";
import { baseClass, Button, variantClasses } from "@/app/_components/button";
import { CalendarMenu } from "@/app/_components/calendarmenu";
import { TextField } from "@/app/_components/formfield";
import { api } from "@/trpc/react";
import { action } from "./logoutaction";

type Props = {
  user: User;
};

export const EditProfile = ({ user }: Props) => {
  const router = useRouter();

  const [recurring, setRecurring] = useState([] as string[]);
  const [weeklyDigest, setWeeklyDigest] = useState(user.weeklyDigestEmail);

  const mutation = api.user.update.useMutation();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const input = Object.fromEntries(data) as Partial<User>;

    mutation.mutate({
      ...input,
      email: input.email ?? undefined,
      displayName: input.displayName ?? "",
      displayImage: input.displayImage ?? "",
      weeklyDigestEmail:
        (input.weeklyDigestEmail as unknown as string) === "true",
      id: user.id,
    });

    toast("User profile updated");
    router.push(`/${user.id}`);
  };

  return (
    <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
      <fieldset className="flex flex-col gap-5">
        <h1 className="text-xl font-bold">Profile Details</h1>
        <TextField
          label="Your default signature"
          id="displayName"
          name="displayName"
          className="text-2xl font-bold"
          defaultValue={user.displayName ?? ""}
          placeholder="Anonymous"
        />
        <TextField
          label="Email"
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
          <Switch.Group
            as="div"
            className="grid grid-cols-3 gap-4 border-b border-slate-200 py-5"
          >
            <Switch.Label
              as="dt"
              className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-100"
              passive
            >
              Weekly Digest
            </Switch.Label>
            <dd className="col-span-2 flex text-sm text-slate-900">
              <input
                type="hidden"
                name="weeklyDigestEmail"
                value={weeklyDigest.toString()}
              />
              <Switch
                checked={weeklyDigest}
                onChange={setWeeklyDigest}
                className={`focus:ring-primary-dark relative ml-auto inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  weeklyDigest ? "bg-primary" : "bg-slate-200 dark:bg-slate-600"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-slate-100 ${
                    weeklyDigest ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </Switch>
            </dd>
          </Switch.Group>
        </dl>
      </fieldset>
      <div className="flex items-center justify-between gap-2">
        <button
          className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-sm leading-4 text-red-700 transition hover:bg-red-50 dark:text-red-500 dark:hover:bg-transparent dark:hover:text-red-700"
          onClick={async (e) => {
            e.preventDefault();
            await action();
          }}
        >
          Logout
        </button>
        <div className="flex gap-2">
          <Link
            className={`${baseClass} ${variantClasses.outline} hover:no-underline`}
            href={`/${user.id}`}
          >
            Back
          </Link>
          <Button>Save Changes</Button>
        </div>
      </div>
    </form>
  );
};
