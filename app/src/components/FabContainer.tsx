import { atom, useAtom, useAtomValue } from "jotai";
import { FaPlus } from "react-icons/fa";
import { Action, Fab } from "react-tiny-fab";

import { fabsAtom } from "./PageLayout";
import { Transition } from "@headlessui/react";

export const fabVisibleAtom = atom(false);

const FabContainer = () => {
  const [isShowing] = useAtom(fabVisibleAtom);
  const fabs = useAtomValue(fabsAtom);
  
  return (
    <Transition
      show={isShowing}
      appear={true}
      unmount={false}
      enter="transition-opacity duration-150 ease-in-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150 ease-in-out"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Fab
        mainButtonStyles={{
          backgroundColor: "#064e3b",
        }}
        alwaysShowTitle={true}
        icon={<FaPlus color="#6ee7b7" />}
        event="click"
      >
        {fabs.map((item, index) => (
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
    </Transition>
  );
};

export default FabContainer;
