import { Suspense, useEffect, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { atom, useAtom, useAtomValue } from "jotai";
import Datepicker from "react-tailwindcss-datepicker";

import { api } from "~/utils/api";
import { groupTransacionsByCategory } from "~/utils/groupTransacionsByCategory";
import { Card } from "~/components/Card";
import { fabAtom } from "~/components/FabContainer";
import { SavingRate } from "~/components/Graphs/SavingRate";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";
import { FlowCard } from "../components/Graphs/FlowCard";
import { MonthOverMonthComparison } from "../components/Graphs/MonthOverMonthComparison";
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

  const [{ data: transactions }, { data: categories }] = api.useQueries((t) => [
    t.transactions.getRange({
      from: startDate,
      to: endDate,
    }),
    t.categories.get(),
  ]);

  const { data: transactionByCategory } = useQuery({
    queryKey: ["transactionByCategory", startDate, endDate],
    queryFn: () => groupTransacionsByCategory(transactions, categories),
    suspense: true,
  });

  if (!transactionByCategory || !categories) return null;

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
          <FlowCard
            className="hidden lg:flex min-h-[25rem] min-w-[25rem]"
            transactions={transactions}
            from={startDate}
            to={endDate}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row lg:hidden gap-4">
        <div className="flex-1">
          <FlowCard
            className="flex min-h-[25rem]"
            transactions={transactions}
            from={startDate}
            to={endDate}
          />
        </div>
        <div>
          <SavingRate transactionByCategory={transactionByCategory} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MonthOverMonthComparison categories={categories} />
      </div>
    </div>
  );
};

const dateRangeAtom = atom({
  startDate: dayjs().startOf("month").toDate().toISOString(),
  endDate: dayjs().endOf("month").toDate().toISOString(),
});

const DatePickerCard = () => {
  const [range, setRange] = useAtom(dateRangeAtom);
  console.log(JSON.stringify(range));
  const [nullishRange, setNullishRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: new Date(range.startDate),
    endDate: new Date(range.endDate),
  });

  const ctx = api.useContext();

  return (
    <Card className="p-4 mb-4">
      <div className="flex-1 dpw">
        <Datepicker
          useRange={false}
          value={nullishRange}
          i18n="it"
          separator="→"
          inputClassName="relative transition-all duration-300 py-2.5 pl-4 pr-14 w-full border-gray-300 dark:border-slate-600 rounded-lg tracking-wide font-light text-sm placeholder-gray-400 bg-input text-foreground focus:ring disabled:opacity-40 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-blue-500/20 font-normal"
          toggleClassName="absolute right-0 h-full px-3 text-gray-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          displayFormat="DD/MM/YYYY"
          onChange={(v) => {
            const startDate = v?.startDate
              ? dayjs(v.startDate).startOf("day").toDate()
              : null;
            const endDate = v?.endDate
              ? dayjs(v.endDate).endOf("day").toDate()
              : null;

            if (startDate && endDate) {
              const startIso = startDate.toISOString();
              const endIso = endDate.toISOString();

              setRange({
                startDate: startIso,
                endDate: endIso,
              });

              ctx.transactions.getRange.invalidate();
            }

            setNullishRange({ startDate, endDate });
          }}
        />
      </div>
    </Card>
  );
};
