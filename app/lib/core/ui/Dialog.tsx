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
    <HeadlessDialog as="div" className="relative z-10" onClose={handleClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-secondary bg-opacity-75" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <HeadlessDialog.Panel
              className={`my-10 inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-center align-middle shadow-xl transition-all dark:bg-slate-900 ${className}`}
            >
              {children}
            </HeadlessDialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </HeadlessDialog>
  </Transition>
);
