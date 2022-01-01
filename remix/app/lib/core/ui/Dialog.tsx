import { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  children?: React.ReactNode;
};

export const Dialog = ({ isOpen, handleClose, children }: Props) => (
  <Transition appear show={isOpen} as={Fragment}>
    <HeadlessDialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto"
      onClose={handleClose}
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
          <HeadlessDialog.Overlay className="fixed inset-0 bg-secondary opacity-70" />
        </Transition.Child>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="inline-block h-screen align-middle" aria-hidden="true">
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
            {children}
          </div>
        </Transition.Child>
      </div>
    </HeadlessDialog>
  </Transition>
);