import { useState, useRef } from "react";
import { useToast } from "~/lib/core/ui/Toaster";
import { Dialog } from "~/lib/core/ui/Dialog";
import { Divider } from "~/lib/core/ui/Divider";
import { iconAttrs } from "~/lib/core/ui/Icon";
import type { SerializedPost } from "~/lib/post/data/postSchema";

type Props = {
  post: SerializedPost;
};

const iconClassName =
  "bg-slate-100 rounded-full p-3 text-slate-500 transition hover:text-primary-dark hover:bg-primary-bg dark:bg-slate-600 dark:text-slate-200 dark:hover:text-primary-light";

export const ShareButton = ({ post }: Props) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);
  const postUrl = `https://yourssincerely.org/posts/${post.id}`;
  const encodedPostUrl = encodeURIComponent(postUrl);

  const copyLink = () => {
    ref.current?.select();
    ref.current?.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(postUrl);
    toast("📝 Copied to Clipboard");
  };

  return (
    <>
      <button
        type="button"
        className="p-2 transition rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: "A tiny beautiful letter",
              url: postUrl,
            });
          } else {
            setIsOpen(true);
          }
        }}
      >
        <svg {...iconAttrs} width="18" height="18">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
      <Dialog isOpen={isOpen} handleClose={() => setIsOpen(false)}>
        <div className="flex justify-center gap-5">
          <a
            className={iconClassName}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="currentColor"
              stroke="none"
            >
              <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
            </svg>
          </a>
          <a
            className={iconClassName}
            href={`http://twitter.com/share?url=${encodedPostUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="currentColor"
              stroke="none"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M15.3 5.55a2.9 2.9 0 0 0-2.9 2.847l-.028 1.575a.6.6 0 0 1-.68.583l-1.561-.212c-2.054-.28-4.022-1.226-5.91-2.799-.598 3.31.57 5.603 3.383 7.372l1.747 1.098a.6.6 0 0 1 .034.993L7.793 18.17c.947.059 1.846.017 2.592-.131 4.718-.942 7.855-4.492 7.855-10.348 0-.478-1.012-2.141-2.94-2.141zm-4.9 2.81a4.9 4.9 0 0 1 8.385-3.355c.711-.005 1.316.175 2.669-.645-.335 1.64-.5 2.352-1.214 3.331 0 7.642-4.697 11.358-9.463 12.309-3.268.652-8.02-.419-9.382-1.841.694-.054 3.514-.357 5.144-1.55C5.16 15.7-.329 12.47 3.278 3.786c1.693 1.977 3.41 3.323 5.15 4.037 1.158.475 1.442.465 1.973.538z" />
            </svg>
          </a>
          <a
            className={iconClassName}
            href={`https://telegram.me/share/url?url=${encodedPostUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="currentColor"
              stroke="none"
            >
              <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0 2C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-3.11-8.83l-2.498-.779c-.54-.165-.543-.537.121-.804l9.733-3.76c.565-.23.885.061.702.79l-1.657 7.82c-.116.557-.451.69-.916.433l-2.551-1.888-1.189 1.148c-.122.118-.221.219-.409.244-.187.026-.341-.03-.454-.34l-.87-2.871-.012.008z" />
            </svg>
          </a>
        </div>
        <Divider bgColor="bg-white dark:bg-slate-900">
          Or share with link
        </Divider>
        <div className="relative">
          <input
            id="share"
            type="text"
            className="w-full transition border-0 rounded bg-slate-100 dark:bg-slate-600"
            value={postUrl}
            onClick={copyLink}
            ref={ref}
            readOnly
          />
          <button
            type="button"
            className="absolute p-2 transition right-3 top-1 bg-slate-100 hover:text-primary-dark dark:bg-slate-600 dark:hover:text-primary-light"
            onClick={copyLink}
          >
            <svg {...iconAttrs}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </Dialog>
    </>
  );
};
