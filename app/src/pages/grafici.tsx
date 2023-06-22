import { Suspense, useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { atom, useAtom, useAtomValue } from "jotai";
import moment from "moment";
import Datepicker from "react-tailwindcss-datepicker";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Category } from "@paxol/db";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { Doughnut } from "~/components/Doughnut";
import { fabAtom } from "~/components/FabContainer";
import { GradientAreaChart } from "~/components/GradientAreaChart";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";
import { Transaction } from "~/components/Transaction";

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

  api.useQueries((t) => [
    t.transactions.getRange({
      from: startDate,
      to: endDate,
    }),
    t.categories.get(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
      <TransactionsPerCategoryCard />
      <BalanceCard />
    </div>
  );
};

type InOut = "in" | "out";

function generateData(
  type: InOut,
  categories: Category[],
  transactions: TransactionWithJoins[],
) {
  const categoryData: {
    id: string;
    name: string;
    value: number;
  }[] = [];

  transactions.forEach((t) => {
    const category = categories.find(
      (c) => c.type === type && c.id == t.categoryId,
    );

    if (!category) return;

    const currentCategoryData = categoryData.find((c) => c.id === t.categoryId);

    if (currentCategoryData) {
      currentCategoryData.value += Number(t.amount);
    } else {
      categoryData.push({
        id: category.id,
        name: category.name,
        value: Number(t.amount),
      });
    }
  });

  categoryData.sort((a, b) => {
    if (a.value > b.value) return -1;
    else if (a.value < b.value) return 1;

    if (a.name > b.name) return -1;
    else if (a.name < b.name) return 1;

    return 0;
  });

  return categoryData;
}

const dateRangeAtom = atom({
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

const TransactionsPerCategoryCard = () => {
  const [listContainerRef] = useAutoAnimate();

  const [transactionType, setTransactionType] = useState<InOut>("in");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const ctx = api.useContext();

  const dateRange = useAtomValue(dateRangeAtom);

  const categories = ctx.categories.get.getData();
  const txs = ctx.transactions.getRange.getData({
    from: dateRange.startDate,
    to: dateRange.endDate,
  });

  const [data, sum] = useMemo(() => {
    if (!categories || !txs) return [undefined];
    const data = generateData(transactionType, categories, txs);
    const sum = data.reduce((sum, item) => sum + item.value, 0);

    return [data, sum];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType, dateRange.startDate, dateRange.endDate]);

  const activeIndex = data?.findIndex(({ id }) => openCategory === id);

  return (
    <Card className="flex-[2_2_0%] dark:text-white">
      <div className="text-lg font-medium dark:text-white mb-3">
        Transazioni per categoria
      </div>
      <div className="flex flex-col overflow-hidden sm:flex-row sm:space-x-4">
        <div className="flex flex-col items-center mt-3">
          <InOutSwitch value={transactionType} onChange={setTransactionType} />
          <div className="w-[300px] h-[300px]">
            {data && (
              <Doughnut
                data={data}
                fill={transactionType === "out" ? "#f87171" : "#4ade80"}
                activeIndex={activeIndex == -1 ? undefined : activeIndex}
              />
            )}
          </div>
        </div>

        <div ref={listContainerRef} className="w-full">
          {data && (
            <>
              <p className="py-3 text-end dark:text-white">
                Totale: {sum.toFixed(2)} €
              </p>

              {data.map((d) => (
                <CategoryCollapse
                  key={d.id}
                  id={d.id}
                  name={d.name}
                  value={d.value}
                  open={d.id === openCategory}
                  setOpen={() =>
                    setOpenCategory(d.id === openCategory ? null : d.id)
                  }
                />
              ))}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const InOutSwitch: React.FC<{
  value: InOut;
  onChange: (value: InOut) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-3">
      <label
        className="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
        htmlFor="transactionType"
      >
        Entrate
      </label>
      <label
        className="relative inline-flex items-center mr-5 cursor-pointer"
        htmlFor="transactionType"
      >
        <input
          id="transactionType"
          type="checkbox"
          className="sr-only peer"
          checked={value === "out"}
          onChange={({ target: { checked } }) =>
            onChange(checked ? "out" : "in")
          }
        />
        <div className="w-11 h-6 bg-green-500 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          Uscite
        </span>
      </label>
    </div>
  );
};

const CategoryCollapse: React.FC<{
  id: string;
  name: string;
  value: number;
  open: boolean;
  setOpen: () => void;
}> = ({ id, name, value, open, setOpen }) => {
  const ctx = api.useContext();
  const dateRange = useAtomValue(dateRangeAtom);

  const txs = ctx.transactions.getRange.getData({
    from: dateRange.startDate,
    to: dateRange.endDate,
  });

  const filteredTxs = useMemo(
    () =>
      txs
        ?.filter((t) => t.categoryId === id)
        .map((t) => <Transaction key={t.id} element={t} hideTitle />),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, dateRange.startDate, dateRange.endDate],
  );

  const [ref] = useAutoAnimate();

  return (
    <div
      className="border-b dark:border-gray-700 last:border-0 py-3 cursor-pointer"
      onClick={() => setOpen()}
    >
      <div className="flex flex-row justify-between items-center">
        <p className="dark:text-white">{name}</p>
        <p className="dark:text-white">{value.toFixed(2)} €</p>
      </div>

      <div
        ref={ref}
        className="cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {open && filteredTxs}
      </div>
    </div>
  );
};

const generate = (
  txs: TransactionWithJoins[],
  start: moment.Moment,
  end: moment.Moment,
) => {
  const balances = [] as number[];
  const days = moment.min(end, moment()).diff(start, "days");

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];

    if (!tx || tx.type === "t" || tx.future) continue;

    const dayIndex = moment(tx.date).diff(start, "days");
    if (dayIndex < 0 || dayIndex >= days) continue;

    const delta = tx.type === "i" ? tx.amount : -tx.amount;
    balances[dayIndex] = (balances[dayIndex] ?? 0) + delta;
  }

  if (!balances[0]) balances[0] = 0;

  for (let i = 1; i < days + 1; i++) {
    const prevBalance = balances[i - 1] ?? 0;
    const balance = balances[i] ?? 0;

    balances[i] = prevBalance + balance;
  }

  return balances.map((balance, idx) => ({
    name: moment(start).add(idx, "days").format("DD"),
    value: Number(balance.toFixed(2)),
  }));
};

const BalanceCard = () => {
  const ctx = api.useContext();

  const dateRange = useAtomValue(dateRangeAtom);

  const txs = ctx.transactions.getRange.getData({
    from: dateRange.startDate,
    to: dateRange.endDate,
  });

  const data = useMemo(() => {
    if (!txs) return;

    return generate(
      txs,
      moment(dateRange.startDate),
      moment(dateRange.endDate),
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate]);

  return (
    <Card className="flex-[1_1_0%]">
      <div className="flex flex-col h-full min-h-[300px]">
        <div className="flex items-center justify-between space-x-4 mb-4">
          <span className="text-lg font-medium dark:text-white">Bilancio</span>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <GradientAreaChart data={data} />
          </div>
        </div>
      </div>
    </Card>
  );
};
