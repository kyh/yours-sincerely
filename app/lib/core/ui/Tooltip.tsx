import { Fragment, useRef, useState, ElementType } from "react";
import { Popover, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Portal } from "react-portal";

type Props = {
  triggerRef?: ElementType<any>;
  offset?: [number, number];
  triggerContent?: React.ReactNode;
  triggerClassName?: string;
  triggerProps?: { [key: string]: any };
  tooltipContent?: React.ReactNode;
  tooltipClassName?: string;
  tooltipProps?: { [key: string]: any };
};

export const Tooltip = ({
  triggerRef,
  offset = [0, 0],
  triggerContent = null,
  triggerClassName = "",
  triggerProps = {},
  tooltipContent = null,
  tooltipClassName = "py-2 px-3 shadow-md text-slate-50 text-xs rounded-md bg-slate-800 dark:bg-slate-900",
  tooltipProps = {},
}: Props) => {
  const tooltipElementRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState(null);
  const [tooltipElement, setTooltipElement] = useState(null);

  const { styles, attributes } = usePopper(triggerElement, tooltipElement, {
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
    setIsOpen(true);
  };

  const onMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <Popover as={Fragment}>
      <Popover.Button
        as={triggerRef ? triggerRef : "button"}
        ref={setTriggerElement}
        className={triggerClassName}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...triggerProps}
      >
        {triggerContent}
      </Popover.Button>
      <Portal>
        <div
          ref={tooltipElementRef}
          style={styles.popper}
          {...attributes.popper}
        >
          <Transition
            show={isOpen}
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            beforeEnter={() => setTooltipElement(tooltipElementRef.current)}
            afterLeave={() => setTooltipElement(null)}
          >
            <Popover.Panel
              static
              className={tooltipClassName}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              {...tooltipProps}
            >
              {tooltipContent}
            </Popover.Panel>
          </Transition>
        </div>
      </Portal>
    </Popover>
  );
};
