import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "~/lib/core/ui/Button";
import { Divide } from "~/lib/core/ui/Divide";
import { TextField } from "~/lib/core/ui/TextField";
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
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={closeModal}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-secondary opacity-70" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-center align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h1" className="text-2xl font-bold mb-4">
                  Even ghostwriters have names
                </Dialog.Title>
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
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
};

export default Page;
