import { Suspense, useEffect, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom, useAtomValue } from "jotai";
import moment from "moment";
import Datepicker from "react-tailwindcss-datepicker";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Category } from "@paxol/db";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { fabAtom } from "~/components/FabContainer";
import { SavingRate } from "~/components/Graphs/SavingRate";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";
import { BalanceCard } from "../components/Graphs/BalanceCard";
import { TransactionsPerCategoryCard } from "../components/Graphs/TransactionsPerCategoryCard";

const Grafici: NextPage = () => {
  const [fab, setFab] = useAtom(fabAtom);

  useEffect(() => {
    if (fab.type !== "none") setFab({ type: "none" });
  });

  return (
    <>
      <Head>
        <title>UMoney - Traccia le tue finanze</title>
        <meta name="description" content="UMoney - Traccia le tue finanze" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PageLayout name="Grafici" protectedPage>
        <DatePickerCard />

        <Suspense fallback={<Loader className="mt-16" />}>
          <GraphsCard />
        </Suspense>
      </PageLayout>
    </>
  );
};

export default Grafici;

const GraphsCard = () => {
  const { startDate, endDate } = useAtomValue(dateRangeAtom);

  const [{ data: transactions }, { data: categories }, { data: wallets }] =
    api.useQueries((t) => [
      t.transactions.getRange({
        from: startDate,
        to: endDate,
      }),
      t.categories.get(),
      t.wallets.get(),
    ]);

  const { data: transactionByCategory } = useQuery({
    queryKey: ["transactionByCategory", startDate, endDate],
    queryFn: () => groupTransacionsByCategory(transactions, categories),
    suspense: true,
  });

  if (!transactionByCategory) return null;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:flex-grow">
          <TransactionsPerCategoryCard
            transactionByCategory={transactionByCategory}
          />
        </div>
        <div className="hidden lg:flex flex-col gap-4">
          <SavingRate transactionByCategory={transactionByCategory} />
          <BalanceCard
            className="hidden lg:flex min-h-[25rem] min-w-[25rem]"
            transactions={transactions}
            wallets={wallets}
            from={startDate}
            to={endDate}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row lg:hidden gap-4">
        <div className="flex-1">
          <BalanceCard
            className="flex min-h-[25rem]"
            transactions={transactions}
            wallets={wallets}
            from={startDate}
            to={endDate}
          />
        </div>
        <div>
          <SavingRate transactionByCategory={transactionByCategory} />
        </div>
      </div>
    </div>
  );
};

export const dateRangeAtom = atom({
  startDate: moment().startOf("month").toDate().toISOString(),
  endDate: moment().endOf("month").toDate().toISOString(),
});

const DatePickerCard = () => {
  const [range, setRange] = useAtom(dateRangeAtom);
  const [nullishRange, setNullishRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: new Date(range.startDate),
    endDate: new Date(range.endDate),
  });

  const ctx = api.useContext();

  useEffect(() => {
    const startDate = nullishRange.startDate?.toISOString();
    const endDate = nullishRange.endDate?.toISOString();

    if (startDate && endDate) {
      setRange({ startDate, endDate });

      ctx.transactions.getRange.invalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRange, nullishRange, setNullishRange]);

  return (
    <Card className="p-4 mb-4">
      <div className="flex-1 dpw">
        <Datepicker
          useRange={false}
          value={nullishRange}
          i18n="it"
          separator="→"
          inputClassName="dark:text-white font-normal"
          toggleClassName="dark:text-white"
          displayFormat="DD/MM/YYYY"
          onChange={(v) => {
            const startDate = v?.startDate ? new Date(v.startDate) : null;
            const endDate = v?.endDate ? new Date(v.endDate) : null;

            setNullishRange({ startDate, endDate });
          }}
        />
      </div>
    </Card>
  );
};

export type CategoryWithTransactions = {
  id: string;
  name: string;
  value: number;
  atBalance: boolean | null;
  transactions: TransactionWithJoins[];
};

function groupTransacionsByCategory(
  transactions: TransactionWithJoins[] | undefined,
  categories: Category[] | undefined,
) {
  if (!transactions || !categories) return { in: [], out: [] };

  const inCategories: CategoryWithTransactions[] = [];
  const outCategories: CategoryWithTransactions[] = [];

  transactions.forEach((t) => {
    const category = categories.find((c) => c.id == t.categoryId);
    if (!category) return;

    const categoryArray = category.type === "in" ? inCategories : outCategories;
    const categoryWithTx = categoryArray.find((c) => c.id === t.categoryId);

    if (categoryWithTx) {
      categoryWithTx.value += Number(t.amount);
      categoryWithTx.transactions.push(t);
    } else {
      categoryArray.push({
        id: category.id,
        name: category.name,
        atBalance: category.atBalance,
        value: Number(t.amount),
        transactions: [t],
      });
    }
  });

  const sorterFunction = (
    a: CategoryWithTransactions,
    b: CategoryWithTransactions,
  ) => {
    if (a.value > b.value) return -1;
    else if (a.value < b.value) return 1;

    if (a.name > b.name) return -1;
    else if (a.name < b.name) return 1;

    return 0;
  };

  inCategories.sort(sorterFunction);
  outCategories.sort(sorterFunction);

  return {
    in: inCategories,
    out: outCategories,
  };
}
