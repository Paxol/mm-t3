import { FC, PropsWithChildren } from "react";
import Link from "next/link";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import { BsTag } from "react-icons/bs";
import { HiOutlineChartPie } from "react-icons/hi";
import { RiArrowLeftRightLine, RiDashboard2Line } from "react-icons/ri";

import FabContainer, { fabVisibleAtom } from "./FabContainer";
import { GenericErrorBoundary } from "./GenericErrorBoundary";
import { LoginPage } from "./LoginPage";

export const PageLayout: FC<
  PropsWithChildren<{ name: string; protectedPage: boolean }>
> = ({ children, name, protectedPage }) => {
  const { data } = useSession();

  if (!data && protectedPage) return <LoginPage />;

  return (
    <main className="mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex-auto w-full pb-20">
        <div className="sm:container mx-auto relative">
          <h1 className="text-2xl font-semibold my-5 text-center text-white">
            {name}
          </h1>

          <GenericErrorBoundary>{children}</GenericErrorBoundary>
        </div>
      </div>

      <BottomNav />
    </main>
  );
};

const pages = [
  {
    name: "Dashboard",
    icon: <RiDashboard2Line className="h-5 w-full" />,
    page: "/",
  },
  // {
  //   name: "Conti",
  //   icon: <MdAttachMoney className="h-5 w-full" />,
  //   page: "/conti",
  // },
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

export const BottomNav: FC = () => {
  const fabVisible = useAtomValue(fabVisibleAtom);

  const width = fabVisible ? "pl-3 pr-2 max-w-lg" : "max-w-fit px-6";

  return (
    <div className="flex-none flex flex-row z-40 fixed bottom-0 left-0 right-0">
      <div
        className={`transition-all mx-auto h-20 container justify-between bg-white dark:bg-gray-900 bottom-nav-content flex flex-row flex-grow relative space-x-3 w-full ${width}`}
        style={{ borderRadius: "12px 12px 0 0" }}
      >
        <div className="flex">
          {pages.map((item, index) => (
            <BottomNavItem key={index} {...item} />
          ))}
        </div>
        <FabContainer />
      </div>
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

  const classes = classNames({
    "min-w-[65px] h-full flex flex-col space-y-1 justify-center hover:no-underline text-center":
      true,
    "text-white": active,
    "hover:text-green-600 text-gray-600 text-gray-500 hover:text-white":
      !active,
  });

  return (
    <Link href={page} className={classes} shallow>
      {icon}
      <span className={`font-normal text-xs ${active ? "block" : "hidden"}`}>
        {name}
      </span>
    </Link>
  );
};
