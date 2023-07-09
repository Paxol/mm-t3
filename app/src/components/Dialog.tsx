import React, { FC, Fragment, PropsWithChildren } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
};

export const Dialog: FC<PropsWithChildren<DialogProps>> = ({
  children,
  open,
  onClose,
}) => {
  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        static
        open={open}
        onClose={onClose}
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
            <HeadlessDialog.Overlay
              className="fixed inset-0"
              style={{ background: "#00000040" }}
            />
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
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              {children}
            </div>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export const DialogTitle = HeadlessDialog.Title;
