import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { setHours, setMinutes } from "date-fns";
import { makeUrls } from "~/lib/core/util/calendar";
import { Button } from "~/lib/core/ui/Button";

type Props = {
  text?: string;
  recurring?: string[];
};

export const CalendarMenu = ({
  text = "Add to Calendar",
  recurring = [],
}: Props) => {
  const now = new Date();
  const links = makeUrls({
    name: "Yours Sincerely",
    details:
      "Your reminder to write on Yours Sincerely: https://yoursincerely.org/posts/new",
    startsAt: setMinutes(setHours(now, 19), 0).toString(),
    endsAt: setMinutes(setHours(now, 19), 15).toString(),
    recurring,
  });

  const menuItemClassName =
    "flex items-center w-full px-2 py-2 text-sm rounded-md text-slate-900 group hover:bg-slate-100 hover:no-underline";

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Button} variant="outline">
        {text}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 w-48 px-1 py-1 mt-2 origin-top-right bg-white divide-y rounded-md shadow-lg divide-slate-200 dark:divide-slate-500 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            <a
              href={links.google}
              target="_blank"
              className={menuItemClassName}
            >
              Google Calendar
            </a>
          </Menu.Item>
          <Menu.Item>
            <a href={links.ics} target="_blank" className={menuItemClassName}>
              Apple Calendar
            </a>
          </Menu.Item>
          <Menu.Item>
            <a
              href={links.outlook}
              target="_blank"
              className={menuItemClassName}
            >
              Outlook Calendar
            </a>
          </Menu.Item>
          <Menu.Item>
            <a href={links.yahoo} target="_blank" className={menuItemClassName}>
              Yahoo Calendar
            </a>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
