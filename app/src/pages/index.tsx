import React, { FC, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import type { Category, Wallet } from "@prisma/client";
import { useAtom } from "jotai";
import moment from "moment";
import { BsPiggyBank } from "react-icons/bs";
import { IoCashOutline } from "react-icons/io5";
import { RiArrowLeftDownLine, RiArrowRightUpLine } from "react-icons/ri";

import { api } from "~/utils/api";
import { cn } from "~/utils/cn";
import { fabAtom } from "~/components/FabContainer";
import { PageLayout } from "~/components/PageLayout";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/Popover";
import { Transaction } from "~/components/Transaction";
import {
  TansactionDialogContainer,
  dialogActionAtom,
} from "~/components/TransactionDialogs/TansactionDialogContainer";
import { Card } from "../components/Card";

type TransactionWithCategory = {
  type: string;
  date: Date;
  category: Category | null;
  id: string;
  amount: number;
  description: string;
  future: boolean;
};

function getMonthEarningAndExpenses(
  transactions: TransactionWithCategory[],
): [number, number] {
  let earnings = 0,
    expenses = 0;

  transactions.forEach((item) => {
    if (moment(item.date).isBefore(moment().startOf("month"))) return;

    if (item.type === "i") earnings += item.amount;
    else if (item.type === "o") expenses += item.amount;
  });

  return [earnings, expenses];
}

function sumWalletsBalances(wallets: Wallet[]): [number, number] {
  let cash = 0,
    investments = 0;

  wallets.forEach((item) => {
    if (item.type === 0) cash += item.currentValue;
    else if (item.type === 1) investments += item.currentValue;
  });

  return [cash, investments];
}

const Home: NextPage = () => (
  <>
    <Head>
      <title>UMoney - Traccia le tue finanze</title>
      <meta name="description" content="UMoney - Traccia le tue finanze" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <PageLayout name="Dashboard" protectedPage>
      <DashboardPage />
    </PageLayout>
  </>
);

export default Home;

const DashboardPage = () => {
  const [dashboard, categories, wallets] = api.useQueries((t) => [
    t.dashboard.transactions(undefined, { suspense: false }),
    t.categories.get(undefined, { suspense: false }),
    t.wallets.get(undefined, { suspense: false }),
    t.dashboard.latestTransactions(undefined, { suspense: false }),
  ]);

  const [, setFab] = useAtom(fabAtom);
  const [, setDialogData] = useAtom(dialogActionAtom);

  const isLoading =
    dashboard.isLoading || categories.isLoading || wallets.isLoading;

  const error = dashboard.error ?? categories.error ?? wallets.error;

  useEffect(() => {
    if (isLoading || !categories.data || !wallets.data) return;

    if (categories.data.length > 0 && wallets.data.length > 0) {
      setFab({
        type: "simple",
        onClick: () => setDialogData(["open", { type: "AddTransaction" }]),
      });
    }
  }, [isLoading, categories.data, wallets.data, setFab, setDialogData]);

  if (!isLoading && error) {
    console.error(error);
    throw error;
  }

  return (
    <div>
      <TansactionDialogContainer />

      <Resume />

      <div className="grid grid-cols-12 gap-4">
        <LatestTransactions className="col-span-12 lg:col-span-6" />
        <Categories className="col-span-6 lg:col-span-3" type="in" />
        <Categories className="col-span-6 lg:col-span-3" type="out" />
      </div>
    </div>
  );
};

const Resume = () => {
  const ctx = api.useContext();
  const transactions = ctx.dashboard.transactions.getData();
  const wallets = ctx.wallets.get.getData();

  const [earnings, expenses] = useMemo(() => {
    if (!transactions) return [0, 0];

    return getMonthEarningAndExpenses(transactions);
  }, [transactions]);

  const [cash, investments] = useMemo(() => {
    if (!wallets) return [0, 0];

    return sumWalletsBalances(wallets);
  }, [wallets]);

  return (
    <div className="flex flex-col items-center gap-4 mb-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <BalanceCard
          icon={<IoCashOutline className="w-6 h-6" />}
          text="Liquidità"
          balance={cash}
        />
        <BalanceCard
          icon={<BsPiggyBank className="w-6 h-6" />}
          text="Investimenti"
          balance={investments}
        />
        <BalanceCard
          icon={<RiArrowLeftDownLine className="w-6 h-6" />}
          text="Entrate"
          balance={earnings}
        />
        <BalanceCard
          icon={<RiArrowRightUpLine className="w-6 h-6" />}
          text="Uscite"
          balance={expenses}
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <span className="cursor-pointer dark:text-white">Mostra conti</span>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-[95vw]">
          <WalletsList />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const Categories: FC<{ className?: string; type?: "in" | "out" }> = ({
  className,
  type = "in",
}) => {
  const ctx = api.useContext();
  const transactions = ctx.dashboard.transactions.getData();

  const categories = useMemo(() => {
    const categoriesMap = new Map<
      string,
      {
        category: Category;
        amount: number;
      }
    >();

    const from = moment().startOf("month");

    if (transactions) {
      transactions.forEach((t) => {
        if (!t.category || t.category.type !== type || from.isAfter(t.date))
          return;

        if (categoriesMap.has(t.category.id.toString())) {
          const val = categoriesMap.get(t.category.id.toString());
          if (!val) return;

          val.amount += t.amount;

          categoriesMap.set(t.category.id.toString(), val);
        } else {
          categoriesMap.set(t.category.id.toString(), {
            category: t.category,
            amount: t.amount,
          });
        }
      });
    }

    return [...categoriesMap.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [transactions, type]);

  if (categories.length === 0) return null;

  return (
    <div className={cn("flex-1", className)}>
      <Card className="p-4">
        <div className="flex flex-none justify-between items-center mb-3">
          <span className="text-lg font-medium dark:text-white">
            {type === "in" ? "Entrate" : "Uscite"}
          </span>
        </div>

        <div className="flex-auto flex flex-col justify-center">
          {categories.map(({ category: { id, type, name }, amount }) => (
            <div
              key={id}
              className="flex border-b py-3 space-x-3 items-center last:border-b-0 dark:border-gray-700"
            >
              <div className="flex-none">
                <div
                  className={`w-4 h-4 ${
                    type === "in" ? "bg-green-400" : "bg-red-400"
                  } rounded-full`}
                ></div>
              </div>
              <div className="flex-auto flex flex-col dark:text-white">
                <span className="text-lg leading-none font-medium mb-1">
                  {name}
                </span>
                <span className="text-sm leading-none text-gray-800 dark:text-gray-100">
                  € {amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const LatestTransactions: FC<{ className?: string }> = ({ className }) => {
  const ctx = api.useContext();
  const latestTransactions = ctx.dashboard.latestTransactions.getData();

  const showLoading = !latestTransactions;

  return (
    <Card className={cn("flex-1", className)}>
      <div className="flex flex-none justify-between items-center mb-3">
        <span className="text-lg font-medium dark:text-white">Transazioni</span>
      </div>

      <div className="flex flex-col">
        {showLoading ? (
          <span className="bg-gray-700 w-full h-[25rem] animate-pulse">
            &nbsp;
          </span>
        ) : latestTransactions && latestTransactions.length > 0 ? (
          latestTransactions.map((t) => <Transaction key={t.id} element={t} />)
        ) : (
          <span className="text-center m-8 dark:text-white">
            Non ci sono transazioni recenti
          </span>
        )}
      </div>
    </Card>
  );
};

type BalanceCardProps = {
  icon: React.ReactNode;
  text: string;
  balance: number;
  className?: string;
};

const BalanceCard = (props: BalanceCardProps) => {
  return (
    <Card
      className={cn("gap-4 items-center dark:text-white p-3", props.className)}
      orientation="horizontal"
    >
      {props.icon}
      <div className="flex flex-col gap-1">
        <span className="dark:text-gray-300 text-gray-700">{props.text}</span>
        <span>€ {props.balance?.toFixed(2)}</span>
      </div>
    </Card>
  );
};

const WalletsList = () => {
  const ctx = api.useContext();
  const transactions = ctx.dashboard.transactions.getData();
  const wallets = ctx.wallets.get.getData();

  const isLoading = transactions === undefined;
  const hasWallets = (wallets?.length || 0) > 0;

  const showNoWalletMessage = !isLoading && !hasWallets;

  return (
    <Card className="items-center w-full p-0 text-center lg:mb-0 sm:flex-row">
      {showNoWalletMessage && (
        <p className="my-5 dark:text-white">Non hai registrato conti</p>
      )}

      {!showNoWalletMessage && (
        <div className="flex flex-col items-center justify-center gap-1 m-2 w-full">
          {transactions ? (
            <>
              <span className="text-md text-gray-300">Conti</span>

              <div>
                {wallets
                  ?.filter((w) => w.type === 0)
                  .map((w) => (
                    <div
                      key={w.id}
                      className="select-none inline-flex flex-col bg-gray-700 text-white rounded-md py-2 px-4 mr-1 mb-1"
                    >
                      <span className="font-medium">{w.name}</span>€{" "}
                      {w.currentValue.toFixed(2)}
                    </div>
                  ))}
              </div>

              <span className="text-md text-gray-300">Investimenti</span>
              <div>
                {wallets
                  ?.filter((w) => w.type === 1)
                  .map((w) => (
                    <div
                      key={w.id}
                      className="select-none inline-flex flex-col bg-gray-700 text-white rounded-md py-2 px-4 mr-1 mb-1"
                    >
                      <span className="font-medium">{w.name}</span>€{" "}
                      {w.currentValue.toFixed(2)}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="rounded-xl bg-gray-700 min-h-[204px] h-full">
                &nbsp;
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
