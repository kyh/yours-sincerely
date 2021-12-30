import { useState, useEffect } from "react";
import { Link } from "remix";
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
  postingAs?: string;
  post?: Post;
  isSubmitting: boolean;
  onSubmit: (post: Post) => void;
};

export const PostForm = ({
  post,
  postingAs,
  onSubmit,
  isSubmitting,
}: Props) => {
  const expiry = addDays(new Date(), POST_EXPIRY_DAYS_AGO);
  const [localPost, setLocalPost] = useState<Post>(post || {});

  useEffect(() => {
    if (!post) setLocalPost(getStoredPost());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const input = Object.fromEntries(data.entries()) as Post;
    storePost(input);
    onSubmit(input);
  };

  return (
    <form className="relative h-full" onSubmit={handleSubmit}>
      <textarea
        className="w-full h-full pt-6 pb-20 resize-none border-none outline-none text-lg"
        name="content"
        defaultValue={localPost.content || ""}
        placeholder="Hello in there?"
        onBlur={(e) => storePost({ content: e.target.value })}
        autoFocus
        required
      />
      <footer className="absolute bottom-5 left-0 right-0 flex justify-between items-center">
        <div className="text-xs">
          <span className="block mb-1">
            {postingAs ? (
              <>
                Publishing as:{" "}
                <Link className="" to="/profile">
                  {postingAs}
                </Link>
              </>
            ) : (
              "Publishing anonymously"
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
    </form>
  );
};