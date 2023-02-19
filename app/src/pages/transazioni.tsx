import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useAtom } from "jotai";
import moment from "moment";
import { useSession } from "next-auth/react";
import { RiArrowLeftRightLine } from "react-icons/ri";
import { TransactionWithJoins } from "@paxol/api/src/types";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { fabVisibleAtom } from "~/components/FabContainer";
import { LoginPage } from "~/components/LoginPage";
import { PageLayout, fabsAtom } from "~/components/PageLayout";
import { Transaction } from "~/components/Transaction";
import {
  TansactionDialogContainer,
  dialogActionAtom,
  dialogOpenAtom,
} from "~/components/TransactionDialogs/TansactionDialogContainer";

function sumTransactionsAmount(transactions: TransactionWithJoins[]): number {
  let somma = 0;
  transactions.forEach((t) => {
    const amount = Number(t.amount);
    somma += t.type === "o" ? -amount : t.type === "i" ? amount : 0;
  });
  return somma;
}

function getDailyTransactionsArray(
  transactions?: TransactionWithJoins[],
): [string, TransactionWithJoins[]][] | null {
  if (!transactions || transactions.length === 0) return null;

  const map = new Map<string, TransactionWithJoins[]>();

  transactions.forEach((t) => {
    const dateString = moment(t.date).format("YYYY-MM-DD");

    if (map.has(dateString)) map.get(dateString)?.push(t);
    else map.set(dateString, [t]);
  });

  return [...map].sort(([a], [b]) => (b > a ? 1 : -1));
}

const Transactions: NextPage = () => {
  const { data } = useSession();
  const [, setFabs] = useAtom(fabsAtom);
  const [, setFabVisible] = useAtom(fabVisibleAtom);

  const [, setDialogData] = useAtom(dialogActionAtom);

  useEffect(() => {
    setFabs([
      {
        text: "Transazione generica",
        color: "rgb(156, 163, 175)",
        icon: (
          <RiArrowLeftRightLine style={{ width: "1.25em", height: "1.25em" }} />
        ),
        onClick: () => setDialogData(["open", { type: "AddTransaction" }]),
      },
    ]);
  }, [setDialogData, setFabs]);

  useEffect(() => {
    setFabVisible(true);

    // setFabs();
    return () => {
      setFabs([]);
    };
  }, [setFabVisible, setFabs]);

  return (
    <>
      <Head>
        <title>UMoney - Traccia le tue finanze</title>
        <meta name="description" content="UMoney - Traccia le tue finanze" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-gray-700">
        {!data ? (
          <LoginPage />
        ) : (
          <PageLayout name="Tansazioni">
            <TansactionDialogContainer />
            <TransactionsPage />
          </PageLayout>
        )}
      </div>
    </>
  );
};

export default Transactions;

const TransactionsPage = () => {
  const from = moment().startOf("month").toISOString();
  const to = moment().endOf("month").toISOString();

  const transactionQuery = api.transactions.getRange.useQuery({ from, to });
  const categoriesQuery = api.categories.get.useQuery();
  const walletsQuery = api.wallets.get.useQuery();

  const isLoading =
    transactionQuery.isLoading ||
    categoriesQuery.isLoading ||
    walletsQuery.isLoading;

  const error =
    transactionQuery.error || categoriesQuery.error || walletsQuery.error;

  const dailyTransactions = useMemo(() => getDailyTransactionsArray(transactionQuery.data), [transactionQuery.data]);

  if (isLoading) return <span>Loading</span>;
  if (error) {
    console.error(error);
    return <span>An error occurred</span>;
  }

  return (
    <Card>
      {dailyTransactions?.map(([date, t]) => (
        <DailyTransactions key={date} date={date} transactions={t} />
      )) ?? <span className="text-center dark:text-white">Nessuna transazione trovata</span>}
    </Card>
  );
};

const DailyTransactions: FC<{
  date: string;
  transactions: TransactionWithJoins[];
}> = ({ date, transactions }) => {
  const [collapseRef] = useAutoAnimate();

  const [, setDialogOpen] = useAtom(dialogOpenAtom);
  const [, setDialogData] = useAtom(dialogActionAtom);

  const [open, setOpen] = useState(true);

  const somma = useMemo(
    () => sumTransactionsAmount(transactions),
    [transactions],
  );

  const handleTxClick = useCallback(
    (t: TransactionWithJoins) => {
      setDialogData([
        "open",
        {
          type: "EditTransaction",
          transaction: t,
        },
      ]);
      setDialogOpen(true);
    },
    [setDialogData, setDialogOpen],
  );

  const handleTxTrashClick = useCallback(
    (t: TransactionWithJoins) => {
      setDialogData([
        "open",
        {
          type: "DeleteTransaction",

          id: t.id,
          amount: t.amount,
          description: t.description,
        },
      ]);
      setDialogOpen(true);
    },
    [setDialogData, setDialogOpen],
  );

  return (
    <div
      className="border-b dark:border-gray-700 last:border-0 pb-3 overflow-hidden"
      onClick={() => setOpen(!open)}
    >
      <div className="flex flex-row justify-between items-center mt-3 cursor-pointer">
        <p className="dark:text-white">{date.split("-").reverse().join("/")}</p>
        <p className="dark:text-white">∑ {somma.toFixed(2)}</p>
      </div>

      <div ref={collapseRef} onClick={(e) => e.stopPropagation()}>
        {open &&
          transactions.map((t) => (
            <Transaction
              key={t.id}
              element={t}
              onElementClick={handleTxClick}
              onTrashClick={handleTxTrashClick}
              showTrash
            />
          ))}
      </div>
    </div>
  );
};
