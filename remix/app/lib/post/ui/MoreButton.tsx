import { useState } from "react";
import { useFetcher, useLoaderData } from "remix";
import { Dialog } from "~/lib/core/ui/Dialog";
import { User } from "~/lib/user/data/userSchema";
import { Post } from "~/lib/post/data/postSchema";

type Props = {
  post: Post;
};

type LoaderData = {
  user: User | null;
};

const buttonClass =
  "text-slate-900 p-5 transition rounded hover:no-underline hover:bg-slate-100";

export const MoreButton = ({ post }: Props) => {
  const { user } = useLoaderData<LoaderData>();
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher();

  const handleFlagPost = async () => {
    await fetcher.submit(null, {
      method: "post",
      action: `/posts/${post.id}/flag`,
    });
  };

  const handleBlockUser = async () => {
    await fetcher.submit(null, {
      method: "post",
      action: `/users/${post.userId}/block`,
    });
  };

  return (
    <>
      <button
        type="button"
        className="text-slate-500 p-2 rounded-lg transition hover:bg-slate-100"
        onClick={() => setIsOpen(true)}
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
      <Dialog isOpen={isOpen} handleClose={() => setIsOpen(false)}>
        <div className="flex flex-col justify-center divide-y">
          <a
            className={buttonClass}
            href={`mailto:kai@kyh.io?subject=Report YS Post: ${post.id}`}
          >
            Report
          </a>
          {!!user && (
            <button
              className={buttonClass}
              type="button"
              onClick={handleFlagPost}
            >
              Mark as inappropriate
            </button>
          )}
          {!!user && (
            <button
              className={buttonClass}
              type="button"
              onClick={handleBlockUser}
            >
              Stop seeing content from this user
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
};
