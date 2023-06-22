import { Suspense, useEffect, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { atom, useAtom, useAtomValue } from "jotai";
import moment from "moment";
import Datepicker from "react-tailwindcss-datepicker";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { fabAtom } from "~/components/FabContainer";
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

  const [{ data: transactions }, { data: categories }] = api.useQueries((t) => [
    t.transactions.getRange({
      from: startDate,
      to: endDate,
    }),
    t.categories.get(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
      <TransactionsPerCategoryCard
        transactions={transactions}
        categories={categories}
      />

      <BalanceCard transactions={transactions} from={startDate} to={endDate} />
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
