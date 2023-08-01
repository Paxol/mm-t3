import { useMemo } from "react";

import { CategoryWithTransactions } from "~/pages/grafici";
import { Card } from "../Card";

export const SavingRate: React.FC<{
  transactionByCategory: {
    in: CategoryWithTransactions[];
    out: CategoryWithTransactions[];
  };
}> = ({ transactionByCategory }) => {
  const data = useMemo(
    () => ({
      in: transactionByCategory.in.filter(item => !(item.atBalance === false)).reduce((acc, item) => acc + item.value, 0),
      out: transactionByCategory.out.filter(item => !(item.atBalance === false)).reduce((acc, item) => acc + item.value, 0),
    }),
    [transactionByCategory],
  );

  const sum = data.in + data.out;
  const diff = data.in - data.out;

  return (
    <Card className="dark:text-white">
      <div className="text-lg font-medium dark:text-white mb-3">
        Tasso di risparmio
      </div>
      <div className="flex flex-col overflow-hidden sm:flex-row sm:space-x-4">
        <div className="flex flex-col items-start mt-3">
          <div>Entrate: {data.in.toFixed(2)} € <span className="text-slate-700 dark:text-slate-300">({(data.in / sum * 100).toFixed(0)} %)</span></div>
          <div>Uscite: {data.out.toFixed(2)} € <span className="text-slate-700 dark:text-slate-300">({(data.out / sum * 100).toFixed(0)} %)</span></div>

          <div className="mt-1">
            Tasso di risparmio: {(diff / data.in * 100).toFixed(0)} %
          </div>
        </div>
      </div>
    </Card>
  );
};
