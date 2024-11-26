import React, { Suspense, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useAtom, useSetAtom } from "jotai";
import moment from "moment";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Budget, Category } from "@paxol/db";

import { api } from "~/utils/api";
import { BudgetCard } from "~/components/BudgetCard";
import { AddBudgetDialog } from "~/components/BudgetDialogs/AddBudgetDialog";
import { EditBudgetDialog, EditBudgetItemAtom } from "~/components/BudgetDialogs/EditBudgetDialog";
import { fabAtom } from "~/components/FabContainer";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";

const Home: NextPage = () => {
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

      <PageLayout name="Budget" protectedPage>
        <Suspense fallback={<Loader className="mt-16" />}>
          <BudgetsPage />
        </Suspense>
      </PageLayout>
    </>
  );
};

export default Home;

type BudgetWithCategory = Budget & {
  category: Category;
};

const BudgetsPage = () => {
  api.categories.get.useQuery();
  const getQuery = api.budgets.get.useQuery();
  const categoryIds = getQuery.data?.map((b) => b.categoryId);

  const txsQuery = api.transactions.getRange.useQuery({
    categories: categoryIds,
    from: moment().startOf("month").toISOString(),
    to: moment().endOf("month").toISOString(),
  });

  const budgetsWithValues = useMemo(
    () => mapBudgetValues(getQuery.data, txsQuery.data),
    [getQuery.data, txsQuery.data],
  );

  const setEditing = useSetAtom(EditBudgetItemAtom)

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
        {budgetsWithValues?.map((el) => (
          <BudgetCard
            key={el.id}
            name={el.category.name}
            amount={el.amount}
            type={el.type}
            value={el.value}
            onEditClick={() => {
              setEditing(el);
            }}
          />
        ))}

        <AddBudgetDialog />
      </div>

      <EditBudgetDialog />
    </>
  );
};

const mapBudgetValues = (
  budgets?: BudgetWithCategory[],
  transactions?: TransactionWithJoins[],
) => {
  if (!budgets || !transactions) return;

  const monthlySum = new Map<string, number>();
  const weeklySum = new Map<string, number>();

  const currentWeek = moment().startOf("week");

  for (const tx of transactions) {
    if (!tx.categoryId) continue;

    if (currentWeek.isSameOrBefore(tx.date)) {
      const current = weeklySum.get(tx.categoryId) ?? 0;
      weeklySum.set(tx.categoryId, current + tx.amount);
    }

    const current = monthlySum.get(tx.categoryId) ?? 0;
    monthlySum.set(tx.categoryId, current + tx.amount);
  }

  return budgets.map((b) => ({
    ...b,
    value:
      b.type === "MONTHLY"
        ? monthlySum.get(b.categoryId) ?? 0
        : weeklySum.get(b.categoryId) ?? 0,
  }));
};
