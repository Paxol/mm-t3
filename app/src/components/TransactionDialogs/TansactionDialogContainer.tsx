import React, { Fragment } from "react";
import { Dialog as HeadlessUIDialog, Transition } from "@headlessui/react";

import { EditTransaction } from "./EditTransaction";
import { useTansactionDialogContext } from "./context";

export const TansactionDialogContainer = () => {
  const { isOpen, close, data } = useTansactionDialogContext();

  return (
    <Transition show={isOpen} as={Fragment}>
      <HeadlessUIDialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        static
        open={isOpen}
        onClose={close}
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
            <HeadlessUIDialog.Overlay
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
              {data?.type === "EditTransaction" && <EditTransaction />}
            </div>
          </Transition.Child>
        </div>
      </HeadlessUIDialog>
    </Transition>
  );
};
