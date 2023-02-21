import React, { useState } from "react";
import { Form, Link, useFormAction, useTransition } from "@remix-run/react";
import { Switch } from "@headlessui/react";
import { Button, baseClass, variantClasses } from "~/components/Button";
import { TextField } from "~/components/FormField";
import { CalendarMenu } from "~/components/CalendarMenu";
import type { User } from "~/lib/user/data/userSchema";
import { DEFAULT_WEEKDAY_LABELS, CALENDAR_LABELS } from "~/components/Activity";

type Props = {
  user: User;
};

export const EditProfile = ({ user }: Props) => {
  const transition = useTransition();
  const [recurring, setRecurring] = useState([] as string[]);
  const [weeklyDigest, setWeeklyDigest] = useState(user.weeklyDigestEmail);

  const handleRecurringDayChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const includes = recurring.includes(event.target.value);
    setRecurring(
      includes
        ? recurring.filter((day) => day !== event.target.value)
        : [...recurring, event.target.value]
    );
  };

  return (
    <Form
      className="flex flex-col gap-10"
      action={`/${user.id}/edit`}
      method="post"
    >
      <fieldset className="flex flex-col gap-5">
        <h1 className="text-xl font-bold">Profile Details</h1>
        <TextField
          label="Your default signature"
          id="displayName"
          name="displayName"
          className="text-2xl font-bold"
          defaultValue={user.displayName || ""}
          placeholder="Anonymous"
        />
        <TextField
          label="Email"
          id="email"
          name="email"
          className="text-2xl font-bold"
          placeholder="your@mail.com"
          defaultValue={user.email || ""}
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
                      CALENDAR_LABELS[day as keyof typeof CALENDAR_LABELS]
                    )}
                    onChange={handleRecurringDayChange}
                  />
                  <div className="w-14 rounded-full bg-slate-200 px-3 pt-10 pb-3 transition peer-checked:bg-primary peer-checked:text-slate-50 dark:bg-slate-600">
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
                className={`relative ml-auto inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2 ${
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
          type="submit"
          formAction={useFormAction("/auth/logout")}
          disabled={transition.state === "submitting"}
        >
          Logout
        </button>
        <div className="flex gap-2">
          <Link
            className={`${baseClass} ${variantClasses.outline} hover:no-underline`}
            to={`/${user.id}`}
          >
            Back
          </Link>
          <Button type="submit" loading={transition.state === "submitting"}>
            Save Changes
          </Button>
        </div>
      </div>
    </Form>
  );
};
