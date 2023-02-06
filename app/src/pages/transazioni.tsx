import { FC, useMemo, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { TransactionWithJoins } from "@paxol/api/src/types";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { LoginPage } from "~/components/LoginPage";
import { PageLayout } from "~/components/PageLayout";
import { Transaction } from "~/components/Transaction";
import { TansactionDialogContainer } from "~/components/TransactionDialogs/TansactionDialogContainer";
import {
  TansactionDialogProvider,
  useTansactionDialogContext,
} from "~/components/TransactionDialogs/context";

function sumTransactionsAmount(transactions: TransactionWithJoins[]): number {
  let somma = 0;
  transactions.forEach((t) => {
    const amount = Number(t.amount);
    somma += t.type === "o" ? -amount : t.type === "i" ? amount : 0;
  });
  return somma;
}

function getDailyTransactionsArray(
  transactions: TransactionWithJoins[],
): [string, TransactionWithJoins[]][] {
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
            <TansactionDialogProvider>
              <TansactionDialogContainer />
              <TransactionsPage />
            </TansactionDialogProvider>
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

  if (isLoading) return <span>Loading</span>;
  if (error) {
    console.error(error);
    return <span>An error occurred</span>;
  }

  return (
    <Card>
      {getDailyTransactionsArray(transactionQuery.data).map(([date, t]) => (
        <DailyTransactions key={date} date={date} transactions={t} />
      ))}
    </Card>
  );
};

const DailyTransactions: FC<{
  date: string;
  transactions: TransactionWithJoins[];
}> = ({ date, transactions }) => {
  const [collapseRef] = useAutoAnimate();

  const { open: openDialog } = useTansactionDialogContext();

  const [open, setOpen] = useState(true);

  const somma = useMemo(
    () => sumTransactionsAmount(transactions),
    [transactions],
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
              onElementClick={() => {
                openDialog({
                  type: "EditTransaction",
                  mode: "modify",
                  transaction: t,
                });
              }}
              // onTrashClick={() => openDelete(t)}
              showTrash
            />
          ))}
      </div>
    </div>
  );
};
