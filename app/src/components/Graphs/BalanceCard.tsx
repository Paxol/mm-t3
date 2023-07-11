import React, { useMemo } from "react";
import moment from "moment";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Wallet } from "@paxol/db";

import { Card } from "~/components/Card";
import { GradientAreaChart } from "~/components/GradientAreaChart";

const generateBalanceData = (
  txs: TransactionWithJoins[],
  wallets: Wallet[],
  start: moment.Moment,
  end: moment.Moment,
) => {
  const cashflow = [] as number[];
  const days = moment.min(end, moment()).diff(start, "days");

  const currentBalance = wallets.reduce(
    (acc, item) => (item.type === 1 ? acc : acc + item.currentValue),
    0,
  );

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];

    if (!tx || tx.type === "t" || tx.future) continue;

    const dayIndex = moment(tx.date).diff(start, "days");
    if (dayIndex < 0 || dayIndex > days) continue;

    const delta = tx.type === "i" ? tx.amount : -tx.amount;
    cashflow[dayIndex] = (cashflow[dayIndex] ?? 0) + delta;
  }

  const balances = Array<number>(days + 1);
  balances[days] = currentBalance;

  for (let i = days; i > 0; i--)
    balances[i - 1] = (balances.at(i) ?? 0) - (cashflow.at(i) ?? 0);

  return balances.map((balance, idx) => ({
    name: moment(start).add(idx, "days").format("DD"),
    value: Number(balance.toFixed(2)),
  }));
};

export const BalanceCard: React.FC<{
  transactions: TransactionWithJoins[] | undefined;
  wallets: Wallet[] | undefined;
  from: string;
  to: string;
  className?: string;
}> = ({ transactions, wallets, from, to, className }) => {
  const data = useMemo(() => {
    return !transactions || !wallets
      ? undefined
      : generateBalanceData(transactions, wallets, moment(from), moment(to));
  }, [transactions, wallets, from, to]);

  return (
    <Card className={className}>
      <div className="flex flex-col flex-1">
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
