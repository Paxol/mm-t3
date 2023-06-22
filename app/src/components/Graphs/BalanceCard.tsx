import React, { useMemo } from "react";
import moment from "moment";
import { TransactionWithJoins } from "@paxol/api/src/types";

import { Card } from "~/components/Card";
import { GradientAreaChart } from "~/components/GradientAreaChart";

const generateBalanceData = (
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

export const BalanceCard: React.FC<{
  transactions: TransactionWithJoins[] | undefined;
  from: string;
  to: string;
}> = ({ transactions, from, to }) => {
  const data = useMemo(() => {
    if (!transactions) return;

    return generateBalanceData(transactions, moment(from), moment(to));
  }, [transactions, from, to]);

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
