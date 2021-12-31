import { useState } from "react";
import { Dialog } from "~/lib/core/ui/Dialog";
import { Button } from "~/lib/core/ui/Button";
import { Divide } from "~/lib/core/ui/Divide";
import { TextField } from "~/lib/core/ui/FormField";
import { PostForm } from "~/lib/post/ui/PostForm";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";

const Page = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <main>
      <PostForm
        postingAs={undefined}
        isSubmitting={false}
        onSubmit={openModal}
      />
      <Dialog isOpen={isOpen} handleClose={closeModal}>
        <h1 className="text-2xl font-bold mb-4">
          Even ghostwriters have names
        </h1>
        <TextField
          id="name"
          label="I'd like to publish as"
          placeholder="Bojack the horse"
        />
        <Button className="mt-4" type="button" onClick={closeModal}>
          Publish
        </Button>
        <Divide bgColor="bg-white">Or continue with</Divide>
        <SocialLoginForm />
      </Dialog>
    </main>
  );
};

export default Page;
