import { FC, PropsWithChildren } from "react";
import Link from "next/link";
import classnames from "classnames";
import { atom, useAtomValue } from "jotai";
import { BsTag } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { HiOutlineChartPie } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import { RiArrowLeftRightLine, RiDashboard2Line } from "react-icons/ri";
import { Action, Fab } from "react-tiny-fab";

export const PageLayout: FC<PropsWithChildren<{ name: string }>> = (props) => {
  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex-auto w-full pb-20 px-4 overflow-y-auto">
        <div className="container mx-auto relative">
          <h1 className="text-2xl font-semibold my-5 text-center text-white">
            {props.name}
          </h1>

          {props.children}
        </div>
      </div>

      <BottomNav />
    </main>
  );
};

interface FABAction {
  text: string;
  color: string;
  icon: JSX.Element;
  onClick?: () => void;
}

export const fabsAtom = atom([] as FABAction[]);
export const showFabAtom = atom(false);

const pages = [
  {
    name: "Dashboard",
    icon: <RiDashboard2Line className="h-5 w-full" />,
    page: "/",
  },
  {
    name: "Conti",
    icon: <MdAttachMoney className="h-5 w-full" />,
    page: "/conti",
  },
  {
    name: "Categorie",
    icon: <BsTag className="h-5 w-full" />,
    page: "/categorie",
  },
  {
    name: "Transazioni",
    icon: <RiArrowLeftRightLine className="h-5 w-full" />,
    page: "/transazioni",
  },
  {
    name: "Grafici",
    icon: <HiOutlineChartPie className="h-5 w-full" />,
    page: "/grafici",
  },
];

const BottomNav: FC = () => {
  const showFab = useAtomValue(showFabAtom);
  const fabs = useAtomValue(fabsAtom);

  const bottomNavContent = classnames({
    "bottom-nav-content px-2 flex flex-row flex-grow relative w-full space-x-3 max-w-3xl":
      true,
    "with-fab justify-start md:justify-center": showFab,
    "justify-center bg-white dark:bg-gray-900": !showFab,
  });

  return (
    <div className="bottom-nav flex-none flex flex-row h-14 z-40 fixed bottom-0 left-0 right-0">
      <div className="spacer-1 flex-grow bg-gray-900"></div>
      <div className={bottomNavContent}>
        {pages.map((item, index) => (
          <BottomNavItem key={index} {...item} />
        ))}
        {showFab && (
          <>
            <div className="w-24 md:hidden justify-self-end shrink-0"></div>
            <Fab icon={<FaPlus />} event="click">
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
          </>
        )}
      </div>
      <div className="spacer-2 flex-grow bg-gray-900"></div>
    </div>
  );
};

const BottomNavItem: React.FC<{
  name: string;
  page: string;
  icon: JSX.Element;
}> = ({ name, page, icon }) => {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const active = path === page && path.length === page.length;

  const classes = classnames({
    "h-full w-full flex flex-col space-y-1 justify-center hover:no-underline text-center":
      true,
    "text-white": active,
    "hover:text-green-600 text-gray-600 text-gray-500 hover:text-white":
      !active,
  });

  return (
    <Link href={page} className={classes}>
      {icon}
      <span
        className={`font-normal text-xs ${
          active ? "block" : "hidden"
        } sm:block`}
      >
        {name}
      </span>
    </Link>
  );
};
