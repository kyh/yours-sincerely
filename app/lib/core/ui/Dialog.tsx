import { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";

type Props = {
  className?: string;
  isOpen: boolean;
  handleClose: () => void;
  children?: React.ReactNode;
};

export const Dialog = ({
  isOpen,
  handleClose,
  className = "",
  children,
}: Props) => (
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

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div
            className={`inline-block w-full max-w-md p-6 my-10 overflow-hidden text-center align-middle transition-all transform bg-white shadow-xl rounded-2xl dark:bg-slate-900 ${className}`}
          >
            {children}
          </div>
        </Transition.Child>
      </div>
    </HeadlessDialog>
  </Transition>
);
