import React, { Fragment } from "react";
import { Dialog as HeadlessUIDialog, Transition } from "@headlessui/react";
import { atom, useAtom, useAtomValue } from "jotai";

import { AddEditTransaction, TransactionDialogData } from "./AddEditTransaction";
import { DeleteTransaction, DeleteTransactionData } from "./DeleteTransaction";

type DialogData = TransactionDialogData | DeleteTransactionData;

export const dialogOpenAtom = atom(false);
const dialogDataAtom = atom<DialogData | null>(null);

export const dialogActionAtom = atom(
  (get) => get(dialogDataAtom),
  (_, set, args: ["close"] | ["open", DialogData]) => {
    if (args[0] === "close") {
      set(dialogOpenAtom, false);
      set(dialogDataAtom, null);
      return;
    }

    set(dialogDataAtom, args[1]);
    set(dialogOpenAtom, true);
  },
);

export const TansactionDialogContainer = () => {
  const [isOpen, setIsOpen] = useAtom(dialogOpenAtom);
  const data = useAtomValue(dialogDataAtom);

  return (
    <Transition show={isOpen} as={Fragment}>
      <HeadlessUIDialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        static
        open={isOpen}
        onClose={() => setIsOpen(false)}
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
              {data?.type === "AddTransaction" && <AddEditTransaction {...data} />}
              {data?.type === "EditTransaction" && <AddEditTransaction {...data} />}
              {data?.type === "DeleteTransaction" && <DeleteTransaction {...data} />}
            </div>
          </Transition.Child>
        </div>
      </HeadlessUIDialog>
    </Transition>
  );
};
