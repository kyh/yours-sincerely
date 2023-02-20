import { useState } from "react";
import { Form, useLoaderData } from "@remix-run/react";
import { Dialog } from "~/lib/core/ui/Dialog";
import type { User } from "~/lib/user/data/userSchema";
import type { SerializedPost } from "~/lib/post/data/postSchema";
import { iconAttrs } from "~/lib/core/ui/Icon";

type Props = {
  post: SerializedPost;
};

type LoaderData = {
  user: User | null;
};

const buttonClass =
  "w-full text-slate-900 p-5 transition rounded hover:no-underline hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800";

export const MoreButton = ({ post }: Props) => {
  const { user } = useLoaderData<LoaderData>();
  const [isOpen, setIsOpen] = useState(false);

  const isLoggedIn = !!user;
  const isPostOwner = user && user.id === post.userId;

  return (
    <>
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">See post options</span>
        <svg {...iconAttrs} width="20" height="20">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
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
            <Form method="post" action={`/posts/${post.id}/delete`}>
              <button type="submit" className={buttonClass}>
                Delete Post
              </button>
            </Form>
          )}
          {isLoggedIn && !isPostOwner && (
            <Form method="post" action={`/posts/${post.id}/flag`}>
              <button type="submit" className={buttonClass}>
                Mark as inappropriate
              </button>
            </Form>
          )}
          {isLoggedIn && !isPostOwner && (
            <Form method="post" action={`/${post.userId}/block`}>
              <button type="submit" className={buttonClass}>
                Stop seeing content from this user
              </button>
            </Form>
          )}
        </div>
      </Dialog>
    </>
  );
};
