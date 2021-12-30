import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { PostForm } from "~/lib/post/ui/PostForm";

const Page = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [localPost, setLocalPost] = useState({});

  useEffect(() => {
    setLocalPost(JSON.parse(localStorage.getItem("post") || "{}"));
  }, []);

  return (
    <main>
      <PostForm
        postingAs={undefined}
        post={localPost}
        isSubmitting={false}
        onSubmit={() => setIsLoginModalOpen(true)}
      />
      <Dialog
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      >
        <Dialog.Overlay />
        <Dialog.Title>Deactivate account</Dialog.Title>
        <Dialog.Description>
          This will permanently deactivate your account
        </Dialog.Description>
        <p>
          Are you sure you want to deactivate your account? All of your data
          will be permanently removed. This action cannot be undone.
        </p>
        <button onClick={() => setIsLoginModalOpen(false)}>Deactivate</button>
        <button onClick={() => setIsLoginModalOpen(false)}>Cancel</button>
      </Dialog>
    </main>
  );
};

export default Page;
