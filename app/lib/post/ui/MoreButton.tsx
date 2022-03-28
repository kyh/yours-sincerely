import { useState } from "react";
import { Form, useLoaderData, useFormAction } from "remix";
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

  const isLoggedIn = !!user;
  const isPostOwner = user && user.id === post.userId;

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
        <Form
          action={`/posts/${post.id}`}
          method="post"
          className="flex flex-col justify-center divide-y divide-slate-200 dark:divide-slate-500"
        >
          <a
            className={buttonClass}
            href={`mailto:kai@kyh.io?subject=Report YS Post: ${post.id}`}
          >
            Report
          </a>
          {isLoggedIn && isPostOwner && (
            <button
              type="submit"
              className={buttonClass}
              formAction={useFormAction(`/posts/${post.id}/delete`)}
            >
              Delete Post
            </button>
          )}
          {isLoggedIn && !isPostOwner && (
            <button
              type="submit"
              className={buttonClass}
              formAction={useFormAction(`/posts/${post.id}/flag`)}
            >
              Mark as inappropriate
            </button>
          )}
          {isLoggedIn && !isPostOwner && (
            <button
              type="submit"
              className={buttonClass}
              formAction={useFormAction(`/${post.userId}/block`)}
            >
              Stop seeing content from this user
            </button>
          )}
        </Form>
      </Dialog>
    </>
  );
};
