import { Post } from "~/lib/post/data/postSchema";

type Props = {
  post: Post;
};

export const MoreButton = ({ post }: Props) => {
  return (
    <button
      type="button"
      className="text-slate-500 p-2 rounded-lg transition hover:bg-slate-100"
      onClick={() => {}}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
      </svg>
    </button>
  );
};
