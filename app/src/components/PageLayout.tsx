import { FC, PropsWithChildren, useCallback } from "react";
import Link from "next/link";
import classNames from "classnames";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { BiWalletAlt } from "react-icons/bi";
import { BsTag } from "react-icons/bs";
import { HiOutlineChartPie } from "react-icons/hi";
import { RiArrowLeftRightLine, RiDashboard2Line } from "react-icons/ri";
import { TbMoneybag } from "react-icons/tb";

import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Card } from "./Card";
import { Dialog } from "./Dialog";
import FabContainer, { fabVisibleAtom } from "./FabContainer";
import { GenericErrorBoundary } from "./GenericErrorBoundary";
import { LoginPage } from "./LoginPage";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { TwButton } from "./TwButton";
import { AddWalletDialog } from "./WalletDialogs/AddWalletDialog";
import { AddCategoryDialog } from "./CategoryDialogs/AddCategoryDialog";

export const PageLayout: FC<
  PropsWithChildren<{ name: string; protectedPage: boolean }>
> = ({ children, name, protectedPage }) => {
  const { data } = useSession();

  if (!data && protectedPage) return <LoginPage />;

  return (
    <main className="mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex-auto w-full pb-20">
        <div className="sm:container mx-auto relative">
          <div className="flex items-center justify-end my-5 relative">
            <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold text-center text-white">
              {name}
            </h1>

            {data && <Profile {...data.user} />}
          </div>

          <DialogManager />

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
    name: "Budget",
    icon: <TbMoneybag className="h-5 w-full" />,
    page: "/budget",
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

type DialogType = "add-wallet" | "add-category" | "none";
type DialogData = {
  open: boolean;
  type: DialogType;
};

const dialogAtom = atom<DialogData>({ open: false, type: "none" });

const Profile: FC<Partial<Session["user"]>> = ({ name, image, email }) => {
  const fallback = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((str) => str[0])
        .join("")
    : email?.at(0) ?? "U";

  const setDialog = useSetAtom(dialogAtom);

  return (
    <Popover>
      <PopoverTrigger>
        <Avatar>
          {image && <AvatarImage src={image} />}
          <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-full max-w-xs">
        <Card className="dark:text-white">
          <div className="text-lg">{name ?? "Utente"}</div>
          {email && <div>{email}</div>}

          <div className="flex flex-col mt-3">
            <TwButton
              variant="ghost"
              className="justify-start"
              onClick={() => setDialog({ type: "add-wallet", open: true })}
            >
              <BiWalletAlt className="mr-2 h-4 w-4" /> Aggiungi Conto
            </TwButton>
            {/* <TwButton variant="ghost" className="justify-start" onClick={() => setDialog({type: "none", open: true})}>
              <MdEdit className="mr-2 h-4 w-4" /> Modifica Conto
            </TwButton> */}
            <TwButton
              variant="ghost"
              className="justify-start"
              onClick={() => setDialog({ type: "add-category", open: true })}
            >
              <BsTag className="mr-2 h-4 w-4" /> Aggiungi Categoria
            </TwButton>
            {/* <TwButton variant="ghost" className="justify-start" onClick={() => setDialog({type: "none", open: true})}>
              <MdEdit className="mr-2 h-4 w-4" /> Modifica Categoria
            </TwButton> */}
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

const DialogManager = () => {
  const [dialog, setDialog] = useAtom(dialogAtom);

  const close = useCallback(
    () => setDialog((prev) => ({ ...prev, open: false })),
    [setDialog],
  );

  return (
    <Dialog open={dialog.open} onClose={close}>
      {dialog.type === "add-wallet" && <AddWalletDialog onClose={close} />}
      {dialog.type === "add-category" && <AddCategoryDialog onClose={close} />}
    </Dialog>
  );
};
