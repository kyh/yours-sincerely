import { useState } from "react";
import { useFetcher, useLoaderData } from "remix";
import { Dialog } from "~/lib/core/ui/Dialog";
import { User } from "~/lib/user/data/userSchema";
import { Post } from "~/lib/post/data/postSchema";
import { iconAttrs } from "~/lib/core/ui/Icon";

type Props = {
  post: Post;
};

type LoaderData = {
  user: User | null;
};

const buttonClass =
  "text-slate-900 p-5 transition rounded hover:no-underline hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800";

export const MoreButton = ({ post }: Props) => {
  const { user } = useLoaderData<LoaderData>();
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher();

  const isLoggedIn = !!user;
  const isPostOwner = user && user.id === post.userId;

  const handleDeletePost = async () => {
    await fetcher.submit(null, {
      method: "delete",
      action: `/posts/${post.id}`,
    });
  };

  const handleFlagPost = async () => {
    await fetcher.submit(null, {
      method: "post",
      action: `/posts/${post.id}/flag`,
    });
  };

  const handleBlockUser = async () => {
    await fetcher.submit(null, {
      method: "post",
      action: `/${post.userId}/block`,
    });
  };

  return (
    <>
      <button
        type="button"
        className="p-2 transition rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => setIsOpen(true)}
      >
        <svg {...iconAttrs} width="20" height="20">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
      <Dialog isOpen={isOpen} handleClose={() => setIsOpen(false)}>
        <div className="flex flex-col justify-center divide-y divide-slate-200 dark:divide-slate-500">
          <a
            className={buttonClass}
            href={`mailto:kai@kyh.io?subject=Report YS Post: ${post.id}`}
          >
            Report
          </a>
          {isLoggedIn && isPostOwner && (
            <button
              className={buttonClass}
              type="button"
              onClick={handleDeletePost}
            >
              Delete Post
            </button>
          )}
          {isLoggedIn && !isPostOwner && (
            <button
              className={buttonClass}
              type="button"
              onClick={handleFlagPost}
            >
              Mark as inappropriate
            </button>
          )}
          {isLoggedIn && !isPostOwner && (
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