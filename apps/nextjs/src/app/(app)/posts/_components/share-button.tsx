"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@init/ui/drawer";
import { dropdownMenuItemVariants } from "@init/ui/dropdown-menu";
import { toast } from "@init/ui/toast";
import { ClipboardCopyIcon, ShareIcon } from "lucide-react";

import type { RouterOutputs } from "@init/api";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const ShareButton = ({ post }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const postUrl = `https://yourssincerely.org/posts/${post.id}`;
  const encodedPostUrl = encodeURIComponent(postUrl);

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    toast.success("📝 Copied to Clipboard");
  };

  const menuItemClassName = dropdownMenuItemVariants({
    className: "w-full justify-start h-10",
  });

  return (
    <>
      <button
        type="button"
        className="size-8 rounded-lg p-2 transition hover:bg-accent"
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
        <span className="sr-only">Share post</span>
        <ShareIcon className="size-4" />
      </button>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Share Post</DrawerTitle>
            <DrawerDescription>
              Share this tiny beautiful letter with the world
            </DrawerDescription>
          </DrawerHeader>
          <a
            className={menuItemClassName}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="size-4"
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            >
              <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
            </svg>
            Share on Facebook
          </a>
          <a
            className={menuItemClassName}
            href={`http://twitter.com/share?url=${encodedPostUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="size-4"
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M15.3 5.55a2.9 2.9 0 0 0-2.9 2.847l-.028 1.575a.6.6 0 0 1-.68.583l-1.561-.212c-2.054-.28-4.022-1.226-5.91-2.799-.598 3.31.57 5.603 3.383 7.372l1.747 1.098a.6.6 0 0 1 .034.993L7.793 18.17c.947.059 1.846.017 2.592-.131 4.718-.942 7.855-4.492 7.855-10.348 0-.478-1.012-2.141-2.94-2.141zm-4.9 2.81a4.9 4.9 0 0 1 8.385-3.355c.711-.005 1.316.175 2.669-.645-.335 1.64-.5 2.352-1.214 3.331 0 7.642-4.697 11.358-9.463 12.309-3.268.652-8.02-.419-9.382-1.841.694-.054 3.514-.357 5.144-1.55C5.16 15.7-.329 12.47 3.278 3.786c1.693 1.977 3.41 3.323 5.15 4.037 1.158.475 1.442.465 1.973.538z" />
            </svg>
            Share on Twitter
          </a>
          <button className={menuItemClassName} onClick={copyLink}>
            <ClipboardCopyIcon aria-hidden="true" className="size-4" />
            Copy Link
          </button>
        </DrawerContent>
      </Drawer>
    </>
  );
};
