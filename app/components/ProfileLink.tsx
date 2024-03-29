import { Link, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { ActivityStats } from "~/components/Activity";
import { Tooltip } from "~/components/Tooltip";

type Props = {
  userId: string;
  displayName: string;
  className?: string;
};

const ProfileTooltip = ({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load(`/${userId}?index`);
    }
  }, []);

  return (
    <div className="flow-root rounded-md not-italic">
      <h4 className="mb-2 text-center font-bold text-slate-900 dark:text-slate-50">
        {displayName}
      </h4>
      {fetcher.data ? (
        <ActivityStats data={fetcher.data.stats} stack />
      ) : (
        <div className="animate-pulse">
          <div className="h-[136px] w-[204px] rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      )}
    </div>
  );
};

export const ProfileLink = ({ userId, displayName, className = "" }: Props) => {
  return (
    <Tooltip
      offset={[0, 8]}
      triggerContent={displayName}
      triggerClassName={`inline-flex text-slate-900 underline underline-offset-2 decoration-dotted dark:text-slate-50 ${className}`}
      tooltipContent={
        <Link to={`/${userId}`} className="hover:no-underline">
          <ProfileTooltip userId={userId} displayName={displayName} />
        </Link>
      }
      tooltipClassName="max-w-[240px] p-4 overflow-hidden bg-white rounded-lg shadow-lg dark:bg-zinc-900"
    />
  );
};
