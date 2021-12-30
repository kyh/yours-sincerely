import { Post } from "~/lib/post/data/postSchema";

type Props = {
  post: Post;
};

export const ShareButton = ({ post }: Props) => {
  return (
    <button
      type="button"
      className="text-slate-500 p-2 rounded-lg transition hover:bg-slate-100"
      onClick={() => {
        if (navigator.share) {
          navigator.share({
            title: "A tiny beautiful letter",
            url: `${window.location.href}/${post.id}`,
          });
        }
      }}
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
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
      </svg>
    </button>
  );
};
