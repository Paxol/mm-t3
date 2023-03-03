import { Transition } from "@headlessui/react";
import { atom, useAtomValue } from "jotai";
import { FaPlus } from "react-icons/fa";
import { Action, Fab } from "react-tiny-fab";

export const fabAtom = atom<FabData>({ type: "none" });
export const fabVisibleAtom = atom((get) => get(fabAtom).type !== "none");

export type FabData =
  | {
      type: "simple";
      onClick: () => void;
    }
  | {
      type: "withMenu";
      actions: FABAction[];
    }
  | {
      type: "none";
    };

export type FABAction = {
  text: string;
  color: string;
  icon: JSX.Element;
  onClick?: () => void;
};

const FabContainer = () => {
  const { type } = useAtomValue(fabAtom);

  return (
    <Transition
      show={type !== "none"}
      appear={true}
      unmount={false}
      enter="transition-opacity duration-150 ease-in-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150 ease-in-out"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <FabWrapper />
    </Transition>
  );
};

const FabWrapper = () => {
  const fab = useAtomValue(fabAtom);

  if (fab.type === "none") return null;

  if (fab.type === "simple")
    return (
      <button
        className="rtf--mb mr-1 mt-3"
        style={{ backgroundColor: "#064e3b" }}
        onClick={fab.onClick}
      >
        <FaPlus color="#6ee7b7" />
      </button>
    );

  return (
    <Fab
      mainButtonStyles={{
        backgroundColor: "#064e3b",
      }}
      alwaysShowTitle={true}
      icon={<FaPlus color="#6ee7b7" />}
      event="click"
    >
      {fab.actions.map((item, index) => (
        <Action
          key={index}
          text={item.text}
          style={{ backgroundColor: item.color }}
          onClick={item.onClick}
        >
          {item.icon}
        </Action>
      ))}
    </Fab>
  );
};

export default FabContainer;
