import { useState, useEffect } from "react";
import { Form } from "remix";
import { addDays, format } from "date-fns";
import { Button } from "~/lib/core/ui/Button";
import { Post, POST_EXPIRY_DAYS_AGO } from "~/lib/post/data/postSchema";

const postKey = "ys-post";

export const storePost = (post: Post) => {
  const postString = JSON.stringify(post);
  localStorage.setItem(postKey, postString);
};

export const getStoredPost = () => {
  const postString = localStorage.getItem(postKey) || "{}";
  return JSON.parse(postString) as Post;
};

export const getStoredPostAndClear = () => {
  const post = getStoredPost();
  localStorage.removeItem(postKey);
  return post;
};

type Props = {
  placeholder?: string;
  postingAs?: string | null;
  post?: Post;
  isSubmitting: boolean;
  onSubmit: () => void;
  updatePostingAs: () => void;
};

export const PostForm = ({
  placeholder = "Hello world",
  post,
  postingAs,
  onSubmit,
  isSubmitting,
  updatePostingAs,
}: Props) => {
  const expiry = addDays(new Date(), POST_EXPIRY_DAYS_AGO);
  const [localPost, setLocalPost] = useState<Post>(post || {});

  useEffect(() => {
    if (!post) setLocalPost(getStoredPost());
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    storePost(Object.fromEntries(data.entries()));
    onSubmit();
  };

  return (
    <Form className="relative h-full" method="post" onSubmit={handleSubmit}>
      <textarea
        className="w-full h-full pt-6 pb-20 text-lg border-none outline-none resize-none dark:bg-slate-800"
        name="content"
        defaultValue={localPost.content || ""}
        placeholder={placeholder}
        onBlur={(e) => storePost({ content: e.target.value })}
        autoFocus
        required
      />
      <footer className="absolute left-0 right-0 flex items-center justify-between bottom-5">
        <div className="text-xs">
          <span className="block mb-1">
            {postingAs ? (
              <>
                Publishing as:{" "}
                <button
                  type="button"
                  className="underline decoration-dotted underline-offset-2"
                  onClick={updatePostingAs}
                >
                  {postingAs}
                </button>
              </>
            ) : (
              <>
                Publishing{" "}
                <button
                  type="button"
                  className="underline decoration-dotted underline-offset-2"
                  onClick={updatePostingAs}
                >
                  anonymously
                </button>
              </>
            )}
          </span>
          <span className="block text-slate-500">
            This post will expire on {format(expiry, "MMMM do")}
          </span>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Publish
        </Button>
      </footer>
    </Form>
  );
};
