import { Suspense, useEffect, useState } from "react";
import Head from "next/head";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom, useAtomValue } from "jotai";
import moment from "moment";
import Datepicker from "react-tailwindcss-datepicker";

import { api } from "~/utils/api";
import {
  CategoryWithTransactions,
  groupTransacionsByCategory,
} from "~/utils/groupTransacionsByCategory";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";

const dateRangeAtom = atom({
  startDate: moment().startOf("month").toISOString(),
  endDate: moment().endOf("month").toISOString(),
});

export default function Export() {
  return (
    <>
      <Head>
        <title>Export - UMoney - Traccia le tue finanze</title>
        <meta name="description" content="UMoney - Traccia le tue finanze" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PageLayout name="Export" protectedPage>
        <DatePickerCard />

        <Suspense fallback={<Loader className="mt-16" />}>
          <ExportContent />
        </Suspense>
      </PageLayout>
    </>
  );
}

function DatePickerCard() {
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
            const startDate = v?.startDate
              ? moment(new Date(v.startDate)).startOf("day").toDate()
              : null;
            const endDate = v?.endDate
              ? moment(new Date(v.endDate)).endOf("day").toDate()
              : null;

            setNullishRange({ startDate, endDate });
          }}
        />
      </div>
    </Card>
  );
}

function ExportContent() {
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

  if (!transactionByCategory) return null;

  return (
    <>
      <Button
        onClick={() => {
          generateFullTransactionsCsv(transactionByCategory.out);
        }}
      >
        Export CSV with all transactions grouped by category
      </Button>
      <Button
        onClick={() => {
          generateTotalsByCategoryCsv(transactionByCategory.out);
        }}
      >
        Export CSV with the sum of transactions grouped by category
      </Button>
    </>
  );
}

function generateFullTransactionsCsv(categories: CategoryWithTransactions[]) {
  const toExport = categories.flatMap((category) =>
    category.transactions.map((tx) => ({
      ...tx,
      categoryId: category.id,
      categoryName: category.name,
    })),
  );

  downloadCsv(toExport);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function downloadCsv(toExport: any) {
  const csvConfig = mkConfig({ useKeysAsHeaders: true });
  const csv = generateCsv(csvConfig)(toExport);
  download(csvConfig)(csv);
}

function generateTotalsByCategoryCsv(categories: CategoryWithTransactions[]) {
  const toExport = categories.map((c) => ({
    id: c.id,
    name: c.name,
    value: c.value,
  }));

  downloadCsv(toExport);
}
