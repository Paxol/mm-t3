import { useMemo, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { TransactionWithJoins } from "@paxol/api/src/types";

import { Card } from "~/components/Card";
import { Doughnut } from "~/components/Doughnut";
import { Transaction } from "~/components/Transaction";
import { CategoryWithTransactions } from "~/utils/groupTransacionsByCategory";

type InOut = "in" | "out";

export const TransactionsPerCategoryCard: React.FC<{
  transactionByCategory: {
    in: CategoryWithTransactions[];
    out: CategoryWithTransactions[];
  };
}> = ({ transactionByCategory }) => {
  const [listContainerRef] = useAutoAnimate();

  const [transactionType, setTransactionType] = useState<InOut>("in");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const data = transactionByCategory[transactionType];
  const sum = useMemo(
    () => data.reduce((acc, item) => acc + item.value, 0),
    [data],
  );

  const activeIndex = data?.findIndex(({ id }) => openCategory === id);

  return (
    <Card className="flex-[2_2_0%] dark:text-white">
      <div className="text-lg font-medium dark:text-white mb-3">
        Transazioni per categoria
      </div>
      <div className="flex flex-col overflow-hidden sm:flex-row sm:space-x-4">
        <div className="flex flex-col items-center mt-3">
          <InOutSwitch value={transactionType} onChange={setTransactionType} />
          <div className="w-[250px] h-[250px]">
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
                  name={d.name}
                  value={d.value}
                  transactions={d.transactions}
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
}> = ({ value, onChange }) => (
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
        onChange={({ target: { checked } }) => onChange(checked ? "out" : "in")}
      />
      <div className="w-11 h-6 bg-green-500 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
        Uscite
      </span>
    </label>
  </div>
);

const CategoryCollapse: React.FC<{
  name: string;
  value: number;
  transactions: TransactionWithJoins[];
  open: boolean;
  setOpen: () => void;
}> = ({ name, value, transactions, open, setOpen }) => {
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
        {open &&
          transactions.map((t) => (
            <Transaction key={t.id} element={t} hideTitle />
          ))}
      </div>
    </div>
  );
};
