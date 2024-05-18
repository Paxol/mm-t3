import { Suspense, useEffect, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom, useAtomValue } from "jotai";
import moment from "moment";
import Datepicker from "react-tailwindcss-datepicker";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { fabAtom } from "~/components/FabContainer";
import { SavingRate } from "~/components/Graphs/SavingRate";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";
import { FlowCard } from "../components/Graphs/FlowCard";
import { TransactionsPerCategoryCard } from "../components/Graphs/TransactionsPerCategoryCard";
import { groupTransacionsByCategory } from "~/utils/groupTransacionsByCategory";

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

  const [{ data: transactions }, { data: categories }] =
    api.useQueries((t) => [
      t.transactions.getRange({
        from: startDate,
        to: endDate,
      }),
      t.categories.get()
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
    </div>
  );
};

export const dateRangeAtom = atom({
  startDate: moment().startOf("month").toDate().toISOString(),
  endDate: moment().endOf("month").toDate().toISOString(),
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
            const startDate = v?.startDate ? moment(new Date(v.startDate)).startOf("day").toDate() : null;
            const endDate = v?.endDate ? moment(new Date(v.endDate)).endOf("day").toDate() : null;

            setNullishRange({ startDate, endDate });
          }}
        />
      </div>
    </Card>
  );
};
