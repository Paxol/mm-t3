import { useMemo } from "react";
import moment from "moment";
import { TransactionWithJoins } from "@paxol/api/src/types";

import { Card } from "~/components/Card";
import { GradientAreaChart } from "~/components/GradientAreaChart";

function generateFlowData(
  txs: TransactionWithJoins[],
  start: moment.Moment,
  end: moment.Moment,
) {
  const cashflow = [] as number[];
  const days = moment.min(end, moment()).diff(start, "days");

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];

    if (!tx || tx.type === "t" || tx.future) continue;

    const dayIndex = moment(tx.date).diff(start, "days");
    if (dayIndex < 0 || dayIndex > days) continue;

    const delta = tx.type === "i" ? tx.amount : -tx.amount;
    cashflow[dayIndex] = (cashflow[dayIndex] ?? 0) + delta;
  }

  if (cashflow[0] == undefined) cashflow[0] = 0;

  for (let i = 0; i < cashflow.length; i++) {
    if (cashflow[i] == undefined) cashflow[i] = 0;
    cashflow[i] += cashflow[i - 1] ?? 0;
  }

  console.log("generateFlowData", start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
  console.log(
    cashflow.map((flow) => flow.toFixed(2).replaceAll(".", ",")).join("\n"),
  );

  return cashflow.map((flow, idx) => ({
    name: moment(start).add(idx, "days").format("DD"),
    value: Number(flow.toFixed(2)),
  }));
}

export const FlowCard: React.FC<{
  transactions: TransactionWithJoins[] | undefined;
  from: string;
  to: string;
  className?: string;
}> = ({ transactions, from, to, className }) => {
  const data = useMemo(() => {
    return !transactions
      ? undefined
      : generateFlowData(transactions, moment(from), moment(to));
  }, [transactions, from, to]);

  return (
    <Card className={className}>
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between space-x-4 mb-4">
          <span className="text-lg font-medium dark:text-white">Flusso di cassa</span>
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
