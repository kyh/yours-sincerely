import { useNavigate } from "@remix-run/react";
import { iconAttrs } from "~/components/Icon";

export const BackButton = () => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <button
      className="inline-flex items-center gap-1 rounded-lg p-2 text-xs text-slate-500 transition hover:bg-slate-100 hover:no-underline dark:text-slate-300 dark:hover:bg-slate-700"
      onClick={goBack}
    >
      <svg {...iconAttrs} className="h-4 w-4">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
      Back
    </button>
  );
};

export default BackButton;
