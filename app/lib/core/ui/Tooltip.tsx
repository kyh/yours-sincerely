import { Fragment, useRef, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";

type Props = {
  offset?: [number, number];
  buttonContent?: React.ReactNode;
  buttonClassName?: string;
  buttonProps?: { [key: string]: any };
  panelContent?: React.ReactNode;
  panelClassName?: string;
  panelProps?: { [key: string]: any };
};

const timeoutDuration = 200;

export const Tooltip = ({
  offset = [0, 0],
  buttonContent = null,
  buttonClassName = "",
  buttonProps = {},
  panelContent = null,
  panelClassName = "py-2 px-3 shadow-md text-slate-50 text-xs rounded-md bg-slate-800 dark:bg-slate-900",
  panelProps = {},
}: Props) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popperElRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "top",
    modifiers: [
      {
        name: "offset",
        options: {
          offset,
        },
      },
    ],
  });

  const onMouseEnter = () => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => setIsOpen(true), timeoutDuration);
  };

  const onMouseLeave = () => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => setIsOpen(false), timeoutDuration);
  };

  return (
    <Popover>
      <Popover.Button
        ref={setReferenceElement}
        className={buttonClassName}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...buttonProps}
      >
        {buttonContent}
      </Popover.Button>
      <div ref={popperElRef} style={styles.popper} {...attributes.popper}>
        <Transition
          show={isOpen}
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          beforeEnter={() => setPopperElement(popperElRef.current)}
          afterLeave={() => setPopperElement(null)}
        >
          <Popover.Panel
            static
            className={panelClassName}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            {...panelProps}
          >
            {panelContent}
          </Popover.Panel>
        </Transition>
      </div>
    </Popover>
  );
};
