import { FC, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { atom, useAtom, useAtomValue } from "jotai";
import moment from "moment";
import { BsFilter } from "react-icons/bs";
import {
  RiArrowLeftDownLine,
  RiArrowLeftRightLine,
  RiArrowRightUpLine,
} from "react-icons/ri";
import Datepicker from "react-tailwindcss-datepicker";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Category } from "@paxol/db";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import { Checkbox } from "~/components/Checkbox";
import { fabAtom } from "~/components/FabContainer";
import { Input } from "~/components/Input";
import { Loader } from "~/components/Loader";
import { PageLayout } from "~/components/PageLayout";
import { Transaction } from "~/components/Transaction";
import {
  TansactionDialogContainer,
  dialogActionAtom,
  dialogOpenAtom,
} from "~/components/TransactionDialogs/TansactionDialogContainer";

function sumTransactionsAmount(transactions: TransactionWithJoins[]): number {
  let somma = 0;
  transactions.forEach((t) => {
    const amount = Number(t.amount);
    somma += t.type === "o" ? -amount : t.type === "i" ? amount : 0;
  });
  return somma;
}

function getDailyTransactionsArray(
  transactions?: TransactionWithJoins[],
): [string, TransactionWithJoins[]][] | null {
  if (!transactions || transactions.length === 0) return null;

  const map = new Map<string, TransactionWithJoins[]>();

  transactions.forEach((t) => {
    const dateString = moment(t.date).format("YYYY-MM-DD");

    if (map.has(dateString)) map.get(dateString)?.push(t);
    else map.set(dateString, [t]);
  });

  return [...map].sort(([a], [b]) => (b > a ? 1 : -1));
}

function applyFilters(
  txs: TransactionWithJoins[] | undefined,
  filters: Filters,
) {
  return txs?.filter((t) => {
    const date = t.date.toISOString();

    if (
      date < (filters.startDate?.toISOString() ?? "") ||
      date > (filters.endDate?.toISOString() ?? "")
    )
      return false;

    if (
      filters.wallets &&
      (filters.wallets.size === 0 || filters.wallets.has(t.walletId ?? ""))
    )
      return false;
    if (
      t.walletToId &&
      filters.wallets &&
      (filters.wallets.size === 0 || filters.wallets?.has(t.walletToId))
    )
      return false;

    if (t.type === "t" && filters.transfer !== undefined) return false;
    if (
      t.type === "i" &&
      t.categoryId &&
      filters.categoriesIn &&
      (filters.categoriesIn.has(t.categoryId) || filters.categoriesIn.size == 0)
    )
      return false;
    if (
      t.type === "o" &&
      t.categoryId &&
      filters.categoriesOut &&
      (filters.categoriesOut.has(t.categoryId) ||
        filters.categoriesOut.size == 0)
    )
      return false;

    if (filters.text != "") {
      const txt = `${t.description} ${t.amount} ${t.wallet?.name ?? ""}  ${
        t.walletTo?.name ?? ""
      } ${t.category?.name}`.toLocaleLowerCase();
      if (!txt.includes(filters.text.toLocaleLowerCase())) return false;
    }

    return true;
  });
}

const Transactions: NextPage = () => (
  <>
    <Head>
      <title>UMoney - Traccia le tue finanze</title>
      <meta name="description" content="UMoney - Traccia le tue finanze" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <PageLayout name="Tansazioni" protectedPage>
      <TansactionDialogContainer />

      <Filters />

      <Suspense fallback={<Loader className="mt-16" />}>
        <TransactionsPage />
      </Suspense>
    </PageLayout>
  </>
);

export default Transactions;

function mostFrequentCategories(
  txs: TransactionWithJoins[] | undefined,
): [Category | undefined, Category | undefined] {
  if (!txs) return [undefined, undefined];

  const frequencyMaps = {
    i: new Map<string, [Category, number]>(),
    o: new Map<string, [Category, number]>(),
  };

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];

    if (!tx || !tx.category || (tx.type !== "i" && tx.type !== "o")) continue;

    const frequency = frequencyMaps[tx.type].get(tx.category.id)?.[1];
    frequencyMaps[tx.type].set(tx.category.id, [
      tx.category,
      frequency ? frequency + 1 : 1,
    ]);
  }

  const topIn = [...frequencyMaps.i.entries()].sort(
    ([, a], [, b]) => b[1] - a[1],
  )[0]?.[1][0];
  const topOut = [...frequencyMaps.o.entries()].sort(
    ([, a], [, b]) => b[1] - a[1],
  )[0]?.[1][0];

  return [topIn, topOut];
}

const TransactionsPage = () => {
  const { from, to } = useAtomValue(dateRangeAtom);
  const filters = useAtomValue(filtersAtom);

  const [, setFab] = useAtom(fabAtom);
  const [, setDialogData] = useAtom(dialogActionAtom);

  const [transactionQuery] = api.useQueries((t) => [
    t.transactions.getRange({ from, to }),
    t.categories.get(),
    t.wallets.get(),
  ]);

  const [topIn, topOut] = useMemo(
    () => mostFrequentCategories(transactionQuery.data),
    [transactionQuery.data],
  );

  useEffect(() => {
    const fabs = [
      {
        text: "Transazione generica",
        color: "rgb(28, 25, 23)",
        icon: (
          <RiArrowLeftRightLine
            className="text-stone-400"
            style={{ width: "1.25em", height: "1.25em" }}
          />
        ),
        onClick: () => setDialogData(["open", { type: "AddTransaction" }]),
      },
    ];

    if (topIn)
      fabs.push({
        text: topIn.name,
        color: "rgb(6, 78, 59)",
        icon: (
          <RiArrowLeftDownLine
            className="text-emerald-400"
            style={{ width: "1.25em", height: "1.25em" }}
          />
        ),
        onClick: () =>
          setDialogData([
            "open",
            {
              type: "AddTransaction",
              transaction: { type: "i", categoryId: topIn.id },
            },
          ]),
      });

    if (topOut)
      fabs.push({
        text: topOut.name,
        color: "rgb(127, 29, 29)",
        icon: (
          <RiArrowRightUpLine
            className="text-red-400"
            style={{ width: "1.25em", height: "1.25em" }}
          />
        ),
        onClick: () =>
          setDialogData([
            "open",
            {
              type: "AddTransaction",
              transaction: { type: "o", categoryId: topOut.id },
            },
          ]),
      });

    setFab({
      type: "withMenu",
      actions: fabs,
    });
  }, [topIn, topOut, setDialogData, setFab]);

  const dailyTransactions = useMemo(
    () =>
      getDailyTransactionsArray(applyFilters(transactionQuery.data, filters)),
    [transactionQuery.data, filters],
  );

  return (
    <Card className="px-4 py-1">
      {dailyTransactions?.map(([date, t]) => (
        <DailyTransactions key={date} date={date} transactions={t} />
      )) ?? (
        <span className="text-center dark:text-white">
          Nessuna transazione trovata
        </span>
      )}
    </Card>
  );
};

const DailyTransactions: FC<{
  date: string;
  transactions: TransactionWithJoins[];
}> = ({ date, transactions }) => {
  const [collapseRef] = useAutoAnimate();

  const [, setDialogOpen] = useAtom(dialogOpenAtom);
  const [, setDialogData] = useAtom(dialogActionAtom);

  const [open, setOpen] = useState(true);

  const somma = useMemo(
    () => sumTransactionsAmount(transactions),
    [transactions],
  );

  const handleTxClick = useCallback(
    (t: TransactionWithJoins) => {
      setDialogData([
        "open",
        {
          type: "EditTransaction",
          transaction: t,
        },
      ]);
      setDialogOpen(true);
    },
    [setDialogData, setDialogOpen],
  );

  const handleTxTrashClick = useCallback(
    (t: TransactionWithJoins) => {
      setDialogData([
        "open",
        {
          type: "DeleteTransaction",

          id: t.id,
          amount: t.amount,
          description: t.description,
        },
      ]);
      setDialogOpen(true);
    },
    [setDialogData, setDialogOpen],
  );

  return (
    <div
      className="border-b dark:border-gray-700 last:border-0 pb-3 overflow-hidden"
      onClick={() => setOpen(!open)}
    >
      <div className="flex flex-row justify-between items-center mt-3 cursor-pointer">
        <p className="dark:text-white">{date.split("-").reverse().join("/")}</p>
        <p className="dark:text-white">∑ {somma.toFixed(2)}</p>
      </div>

      <div ref={collapseRef} onClick={(e) => e.stopPropagation()}>
        {open &&
          transactions.map((t) => (
            <Transaction
              key={t.id}
              element={t}
              onElementClick={handleTxClick}
              onTrashClick={handleTxTrashClick}
              showTrash
            />
          ))}
      </div>
    </div>
  );
};

type Unchecked = {
  wallets: Set<string> | undefined;
  categoriesIn: Set<string> | undefined;
  categoriesOut: Set<string> | undefined;
  transfer: Set<string> | undefined;
};

type Filters = {
  startDate: Date | null;
  endDate: Date | null;
  text: string;
} & Unchecked;

const defaultStartDate = moment().startOf("month").toDate();
const defaultEndDate = moment().endOf("month").toDate();

const dateRangeAtom = atom({
  from: defaultStartDate.toISOString(),
  to: defaultStartDate.toISOString(),
});

const filtersAtom = atom<Filters>({
  startDate: defaultStartDate,
  endDate: defaultEndDate,
  text: "",

  wallets: undefined,
  categoriesIn: undefined,
  categoriesOut: undefined,
  transfer: undefined,
});

const Filters = () => {
  const ctx = api.useContext();
  const [filters, setFilters] = useAtom(filtersAtom);
  const [, setDateRange] = useAtom(dateRangeAtom);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      setDateRange({
        from: filters.startDate.toISOString(),
        to: filters.endDate.toISOString(),
      });

      ctx.transactions.getRange.invalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

  const [ref] = useAutoAnimate();

  return (
    <Card className="p-4 mb-4">
      <div className="flex space-x-4">
        <div className="flex-1 dpw">
          <Datepicker
            useRange={false}
            value={filters}
            i18n="it"
            separator="→"
            inputClassName="dark:text-white font-normal"
            toggleClassName="dark:text-white"
            displayFormat="DD/MM/YYYY"
            onChange={(v) => {
              const startDate = v?.startDate ? new Date(v.startDate) : null;
              const endDate = v?.endDate ? new Date(v.endDate) : null;

              setFilters((f) => ({ ...f, startDate, endDate }));
            }}
          />
        </div>
        <button className="flex-none" onClick={() => setShowAll(!showAll)}>
          <BsFilter className="text-white w-5 h-5" />
        </button>
      </div>

      <div ref={ref}>{showAll && <AdvancedFilters />}</div>
    </Card>
  );
};

const AdvancedFilters = () => {
  const [filters, setFilters] = useAtom(filtersAtom);
  const ctx = api.useContext();

  const wallets = ctx.wallets.get
    .getData()
    ?.map((w) => ({ id: w.id, label: w.name }));

  const categoriesIn = ctx.categories.get
    .getData()
    ?.filter((c) => c.type === "in")
    .map((c) => ({ id: c.id, label: c.name }));
  const categoriesOut = ctx.categories.get
    .getData()
    ?.filter((c) => c.type === "out")
    .map((c) => ({ id: c.id, label: c.name }));

  if (!wallets || !categoriesIn || !categoriesOut) return <Loader />;

  return (
    <div className="flex flex-col space-y-4">
      <div className="-mb-2">
        <div className="font-medium capitalize dark:text-white mb-2">Testo</div>

        <div className="relative">
          <Input
            type="text"
            placeholder="Cerca nel contenuto"
            value={filters.text}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, text: value }))
            }
          />
        </div>
      </div>

      <div>
        <div className="font-medium capitalize dark:text-white mb-2">Conti</div>

        <CheckboxGroup
          elements={wallets}
          masterLabel="Tutti i conti"
          type="wallets"
        />
      </div>

      <div>
        <div className="font-medium capitalize dark:text-white mb-2">
          Categorie
        </div>

        <CheckboxGroup
          elements={categoriesIn}
          masterLabel="Tutti le entrate"
          type="categoriesIn"
        />

        <div className="mb-4"></div>
        <CheckboxGroup
          elements={categoriesOut}
          masterLabel="Tutti le uscite"
          type="categoriesOut"
        />

        <div className="mb-4"></div>
        <CheckboxGroup
          elements={[]}
          masterLabel="Tutti i trasferimenti"
          type="transfer"
        />
      </div>
    </div>
  );
};

type Args =
  | {
      action: "ToggleMaster";
      set: keyof Unchecked;
    }
  | {
      action: "Toggle";
      set: keyof Unchecked;
      id: string;
      elements: string[];
    };

const checkboxesAtom = atom(null, (get, set, args: Args) => {
  if (args.action === "ToggleMaster") {
    set(filtersAtom, (f) => ({
      ...f,
      [args.set]: f[args.set] ? undefined : new Set<string>(),
    }));
    return;
  }

  let current = get(filtersAtom)[args.set];

  if (!current) {
    set(filtersAtom, (f) => ({ ...f, [args.set]: new Set([args.id]) }));
    return;
  }

  if (current.size === 0) current = new Set(args.elements);

  if (current.has(args.id)) current.delete(args.id);
  else current.add(args.id);

  set(filtersAtom, (f) => ({
    ...f,
    [args.set]: current?.size === 0 ? undefined : current,
  }));
});

interface ICheckbox {
  id: string;
  label: string;
}

type CheckboxGroupProps = {
  elements: ICheckbox[];
  masterLabel: string;
  type: Args["set"];
};

const CheckboxGroup: FC<CheckboxGroupProps> = ({
  elements,
  masterLabel,
  type,
}) => {
  const filters = useAtomValue(filtersAtom);
  const [, set] = useAtom(checkboxesAtom);

  const excludedCheckboxes = filters[type];

  const masterChecked = !excludedCheckboxes;

  return (
    <div className="cbgroup">
      <Checkbox
        checked={masterChecked}
        onChange={() =>
          set({
            action: "ToggleMaster",
            set: type,
          })
        }
      >
        {masterLabel}
      </Checkbox>
      <div className="ml-3">
        {elements.map(({ id, label }) => {
          const blacklisted = excludedCheckboxes
            ? excludedCheckboxes.size === 0 || excludedCheckboxes.has(id)
            : false;

          return (
            <div key={id} className="mt-1 lg:mt-0">
              <Checkbox
                checked={!blacklisted}
                onChange={() =>
                  set({
                    elements: elements.map((e) => e.id),
                    action: "Toggle",
                    set: type,
                    id,
                  })
                }
              >
                {label}
              </Checkbox>
            </div>
          );
        })}
      </div>
    </div>
  );
};
