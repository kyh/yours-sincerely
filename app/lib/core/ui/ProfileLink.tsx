import { Link } from "remix";
import { Tooltip } from "~/lib/core/ui/Tooltip";

type Props = {
  userId: string;
  displayName: string;
  className?: string;
};

export const ProfileLink = ({ userId, displayName, className = "" }: Props) => {
  return (
    <Tooltip
      offset={[0, 8]}
      buttonContent={displayName}
      buttonClassName={`inline-flex text-slate-900 underline underline-offset-2 decoration-dotted dark:text-slate-50 ${className}`}
      buttonProps={{
        as: Link,
        to: `/${userId}`,
      }}
      panelContent={
        <div className="flow-root not-italic rounded-md">
          <h4 className="font-bold text-slate-900 dark:text-slate-50">
            {displayName}
          </h4>
          <span className="block text-sm text-gray-500 dark:text-slate-300">
            Stats coming soon...
          </span>
        </div>
      }
      panelClassName="max-w-[240px] p-4 overflow-hidden bg-white rounded-lg shadow-lg dark:bg-slate-900"
    />
  );
};
