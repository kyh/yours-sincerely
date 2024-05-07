import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();
  const goBack = () => router.back();

  return (
    <button
      className="inline-flex items-center gap-1 rounded-lg p-2 text-xs text-slate-500 transition hover:bg-slate-100 hover:no-underline dark:text-slate-300 dark:hover:bg-slate-700"
      onClick={goBack}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
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
