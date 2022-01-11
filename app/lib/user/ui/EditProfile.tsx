import React, { useState } from "react";
import { Link, Form, useTransition, useFormAction } from "remix";
import { Switch } from "@headlessui/react";
import { Button } from "~/lib/core/ui/Button";
import { TextField } from "~/lib/core/ui/FormField";
import { CalendarMenu } from "~/lib/core/ui/CalendarMenu";
import { User } from "~/lib/user/data/userSchema";
import { classNames } from "~/lib/core/util/styles";
import {
  DEFAULT_WEEKDAY_LABELS,
  CALENDAR_LABELS,
} from "~/lib/core/ui/Activity";

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
            <div className="flex justify-between items-top">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-100">
                Writing Reminders
              </dt>
              <dd>
                <CalendarMenu text="Add Reminder" recurring={recurring} />
              </dd>
            </div>
            <div className="flex w-full mt-3 justify-evenly">
              {DEFAULT_WEEKDAY_LABELS.map((day) => (
                <label key={day} className="text-center cursor-pointer">
                  <input
                    className="hidden peer"
                    type="checkbox"
                    name={`reminder-${day}`}
                    id={`reminder-${day}`}
                    value={CALENDAR_LABELS[day as keyof typeof CALENDAR_LABELS]}
                    checked={recurring.includes(
                      CALENDAR_LABELS[day as keyof typeof CALENDAR_LABELS]
                    )}
                    onChange={handleRecurringDayChange}
                  />
                  <div className="px-3 pt-10 pb-3 transition rounded-full w-14 bg-slate-200 peer-checked:bg-primary peer-checked:text-slate-50 dark:bg-slate-600">
                    {day}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <Switch.Group
            as="div"
            className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-b sm:border-slate-200"
          >
            <Switch.Label
              as="dt"
              className="text-sm font-medium text-slate-500 dark:text-slate-100"
              passive
            >
              Weekly Digest
            </Switch.Label>
            <dd className="flex mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              <input
                type="hidden"
                name="weeklyDigestEmail"
                value={weeklyDigest.toString()}
              />
              <Switch
                checked={weeklyDigest}
                onChange={setWeeklyDigest}
                className={classNames(
                  weeklyDigest
                    ? "bg-primary"
                    : "bg-slate-200 dark:bg-slate-600",
                  "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark sm:ml-auto"
                )}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    weeklyDigest ? "translate-x-5" : "translate-x-0",
                    "inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 dark:bg-slate-100"
                  )}
                />
              </Switch>
            </dd>
          </Switch.Group>
        </dl>
      </fieldset>
      <div className="flex items-center justify-between gap-2">
        <button
          className="inline-flex items-center justify-center px-3 py-2 text-sm leading-4 text-red-700 transition border border-transparent rounded-md hover:bg-red-50 dark:text-red-500 dark:hover:bg-transparent dark:hover:text-red-300"
          type="submit"
          formAction={useFormAction("/auth/logout")}
          disabled={transition.state === "submitting"}
        >
          Logout
        </button>
        <div className="flex gap-2">
          <Link
            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 bg-white border rounded-md shadow-sm text-slate-700 border-slate-300 hover:bg-slate-50 hover:no-underline"
            to={`/${user.id}`}
          >
            Back
          </Link>
          <Button type="submit" disabled={transition.state === "submitting"}>
            Save Changes
          </Button>
        </div>
      </div>
    </Form>
  );
};
