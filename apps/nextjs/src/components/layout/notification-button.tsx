import { useKnockFeed } from "@knocklabs/react-notification-feed";
import { iconAttrs } from "./icon";

type NotificationButtonProps = {
  notifButtonRef: React.RefObject<HTMLButtonElement>;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isVisible: boolean;
};

const navLinkButtonClassName =
  "relative inline-flex items-center px-2 py-2 border-2 border-slate-200 text-sm font-medium text-slate-500 bg-white transition cursor-pointer outline-offset-[-2px] peer-checked:text-primary-dark peer-checked:bg-primary-bg peer-focus:outline peer-focus:z-10 hover:z-10 hover:border-primary hover:text-primary-dark hover:bg-primary-bg dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:peer-checked:bg-slate-700 dark:peer-checked:text-primary-light dark:hover:text-primary-light dark:hover:border-primary-light";

const NotificationButton = ({
  notifButtonRef,
  setIsVisible,
  isVisible,
}: NotificationButtonProps) => {
  const { useFeedStore } = useKnockFeed();
  const items = useFeedStore((state) => state.items);
  const hasUnread = items.some((item) => !item.read_at);

  return (
    <button
      className={`${navLinkButtonClassName} rounded-md shadow-sm`}
      ref={notifButtonRef}
      onClick={() => setIsVisible(!isVisible)}
    >
      {hasUnread && (
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
      )}
      <span className="sr-only">Open notifications</span>
      <svg {...iconAttrs} strokeWidth="2.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
    </button>
  );
};

export default NotificationButton