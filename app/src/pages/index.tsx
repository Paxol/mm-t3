import { FC, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Category, Wallet } from "@prisma/client";
import { useAtom } from "jotai";
import moment from "moment";

import { api } from "~/utils/api";
import { fabAtom } from "~/components/FabContainer";
import { PageLayout } from "~/components/PageLayout";
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

  const showCategoriesCards = isLoading || (dashboard.data?.length || 0) > 0;

  return (
    <div>
      <TansactionDialogContainer />

      <div className="flex flex-col lg:mb-4 lg:flex-row lg:space-x-4">
        <Resume />
        {showCategoriesCards && (
          <div className="flex flex-wrap -mr-4">
            <Categories type="in" />
            <Categories type="out" />
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        {/* <CardGrafico transazioni={transazioni} conti={wallets} /> */}

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 lg:flex-3">
          <LatestTransactions />
        </div>
      </div>
    </div>
  );
};

const Resume = () => {
  const ctx = api.useContext();
  const transactions = ctx.dashboard.transactions.getData();
  const wallets = ctx.wallets.get.getData();

  const [infoContainer] = useAutoAnimate<HTMLDivElement>();

  const [earnings, expenses] = useMemo(() => {
    if (!transactions) return [undefined, undefined];

    return getMonthEarningAndExpenses(transactions);
  }, [transactions]);

  const [cash, investments] = useMemo(() => {
    if (!transactions || !wallets) return [undefined, undefined];

    return sumWalletsBalances(wallets);
  }, [transactions, wallets]);

  const isLoading = transactions === undefined;
  const hasWallets = (wallets?.length || 0) > 0;

  const showNoWalletMessage = !isLoading && !hasWallets;

  return (
    <Card className="lg:flex-[7_7_0%] xl:flex-[6_6_0%] items-center w-full mb-4 lg:mb-0 text-center sm:flex-row sm:space-x-6 sm:text-left lg:px-8 lg:space-x-16 xl:px-12 xl:space-x-24">
      <div
        ref={infoContainer}
        className={showNoWalletMessage ? "flex-auto" : ""}
      >
        <span className="text-xl text-gray-400">Bilancio</span>
        {!showNoWalletMessage && (
          <>
            <div className="flex flex-col flex-none space-y-5 mt-5 justify-center self-center">
              <Balance cash={cash} investments={investments} />

              <div className="flex space-x-8 flex-none lg:flex-col lg:space-x-0 lg:space-y-4 xl:flex-row xl:space-x-4 xl:space-y-0">
                {/* Entrate */}
                <InOutSum type="in" value={earnings} />

                {/* Uscite */}
                <InOutSum type="out" value={expenses} />
              </div>
            </div>
          </>
        )}

        {showNoWalletMessage && (
          <p className="my-5 dark:text-white">Non hai registrato conti</p>
        )}
      </div>

      {!showNoWalletMessage && (
        <div className="flex flex-col justify-center mt-2 pt-2 sm:mt-0 sm:p-0 w-full">
          {transactions ? (
            <>
              <span className="text-md text-gray-300 mb-1">Conti</span>

              <div className="mb-1">
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

              <span className="text-md text-gray-300 mb-1">Investimenti</span>
              <div className="">
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

const InOutSum: FC<{
  type: "in" | "out";
  value?: number;
}> = ({ type, value }) => {
  const svgClasses =
    type === "in" ? "flex-none text-green-500" : "flex-none text-red-500";

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <svg
          className={svgClasses}
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 448 512"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          {type === "in" ? (
            <path d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"></path>
          ) : (
            <path d="M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z"></path>
          )}
        </svg>
        {value !== undefined ? (
          <span className="flex-auto font-medium text-white">
            € {value.toFixed(2)}
          </span>
        ) : (
          <span className="flex-auto rounded-md bg-gray-700 w-16 animate-pulse">
            &nbsp;
          </span>
        )}
      </div>
      <span className="font-light whitespace-nowrap text-gray-500">
        {type === "in" ? "Entrate" : "Uscite"} del mese
      </span>
    </div>
  );
};

const Balance: FC<{
  cash?: number;
  investments?: number;
}> = ({ cash, investments }) => (
  <div className="flex flex-col">
    {cash !== undefined ? (
      <span className="text-3xl font-bold text-white">€ {cash.toFixed(2)}</span>
    ) : (
      <span className="text-3xl rounded-xl bg-gray-700 w-32 animate-pulse">
        &nbsp;
      </span>
    )}
    <span className="text-sm font-medium text-gray-400 mb-3">in liquidità</span>
    {investments !== undefined ? (
      <span className="text-xl font-bold text-white">
        € {investments.toFixed(2)}
      </span>
    ) : (
      <span className="text-xl rounded-md bg-gray-700 w-24 animate-pulse">
        &nbsp;
      </span>
    )}
    <span className="text-sm font-medium text-gray-400">in investimenti</span>
  </div>
);

const Categories: FC<{ type?: "in" | "out" }> = ({ type = "in" }) => {
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

    if (transactions) {
      transactions.forEach((t) => {
        if (!t.category || t.category.type !== type) return;

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
    <div className="grow basis-1/2 pr-4">
      <Card className="lg:h-full mb-4 p-4">
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
                {/* <div
                className={`w-10 h-10 ${
                  type === "in" ? "bg-green-400" : "bg-red-400"
                } text-gray-800 p-1.5 rounded-2xl`}
                >
                <RiMoneyEuroCircleLine className="w-full h-full" />
              </div> */}
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

const LatestTransactions: FC = () => {
  const {
    data: latestTransactions,
    isLoading,
    error,
  } = api.dashboard.latestTransactions.useQuery();

  const [ref] = useAutoAnimate<HTMLDivElement>();

  const showLoading = isLoading;
  const showError = !showLoading && !!error;
  const showTxs =
    !showLoading &&
    !showError &&
    latestTransactions &&
    latestTransactions.length > 0;

  return (
    <Card className="flex-1 mb-4">
      <div className="flex flex-none justify-between items-center mb-3">
        <span className="text-lg font-medium dark:text-white">Transazioni</span>
      </div>

      <div ref={ref} className="flex flex-col">
        {showLoading && (
          <span className="bg-gray-700 min-w-[285px] w-full h-[359px] animate-pulse">
            &nbsp;
          </span>
        )}

        {showError && (
          <span className="dark:text-white">Si è verificato un errore</span>
        )}

        {showTxs
          ? latestTransactions.map((t) => (
              <Transaction key={t.id} element={t} />
            ))
          : !showLoading && (
              <span className="text-center m-8 dark:text-white">
                Non ci sono transazioni recenti
              </span>
            )}
      </div>
    </Card>
  );
};
