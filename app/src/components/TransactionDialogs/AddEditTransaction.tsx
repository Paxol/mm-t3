import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { useAtom } from "jotai";
import moment from "moment";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Category, Transaction, Wallet } from "@paxol/db";

import { api } from "~/utils/api";
import { Button } from "../Button";
import { Input } from "../Input";
import { SearchableCombobox } from "../SearchableCombobox";
import { dialogOpenAtom } from "./TansactionDialogContainer";

export type TransactionDialogData =
  | {
      type: "EditTransaction";
      transaction: Transaction | TransactionWithJoins;
    }
  | {
      type: "AddTransaction";
      transaction?: Transaction | TransactionWithJoins;
    };

export interface FormType {
  type?: string;
  date?: string;
  time?: string;
  description?: string;
  amount?: string | number;
}

export const AddEditTransaction: React.FC<TransactionDialogData> = (data) => {
  const [, setDialogOpen] = useAtom(dialogOpenAtom);

  const createTx = api.transactions.create.useMutation();
  const updateTx = api.transactions.update.useMutation();

  const apiContext = api.useContext();
  const categories = apiContext.categories.get.getData();
  const wallets = apiContext.wallets.get
    .getData()
    ?.sort((a, b) => (b.name > a.name ? -1 : 1));

  const defaultValues = getTxDefaults(data, wallets, categories);

  const [wallet, setWallet] = useState<Wallet | undefined>(
    defaultValues?.wallet,
  );
  const [walletTo, setWalletTo] = useState<Wallet | undefined>(
    defaultValues?.walletTo,
  );
  const [category, setCategory] = useState<Category | undefined>(
    defaultValues?.category,
  );

  const [form, setForm, handleFormChange] = useForm<FormType>(
    defaultValues || {
      type: "i",
      amount: 0,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("HH:mm"),
      description: "",
    },
  );

  const walletToValues = useMemo(
    () => wallets?.filter((w) => !wallet || w.id != wallet.id),
    [wallet, wallets],
  );

  const handleSubmit = useCallback(() => {
    if (!data) return;

    const values = {
      amount: Number(form.amount),
      date: moment(
        `${form.date} ${form.time}`,
        "YYYY/MM/DD HH:mm",
      ).toISOString(),
      description: form.description || "",
      type: form.type as "i" | "o" | "t",
      categoryId: category?.id ?? null,
      walletId: wallet?.id ?? "",
      walletToId: walletTo?.id ?? null,
    };

    if (data.type === "AddTransaction") createTx.mutate(values);

    if (data.type === "EditTransaction")
      updateTx.mutate({ ...values, id: data.transaction.id });

    // setDialogOpen(false);
  }, [form, wallet, walletTo, category, data, createTx, updateTx]);

  useEffect(() => {
    if (createTx.status === "success" || updateTx.status === "success") {
      setDialogOpen(false);
      apiContext.transactions.getRange.invalidate();
      apiContext.wallets.invalidate();
    }
  })

  if (!data) return null;

  if (!categories || !wallets || !walletToValues) return null;

  const categoriesToShow = categories
    .filter((c) => {
      if (form.type === "i") return c.type === "in";
      if (form.type === "o") return c.type === "out";
      return false;
    })
    .sort((a, b) => (b.name > a.name ? -1 : 1));

  return (
    <>
      <Dialog.Title
        as="h3"
        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
      >
        {data.type === "AddTransaction"
          ? "Aggiungi transazione"
          : "Modifica transazione"}
        {/* Modifica transazione */}
      </Dialog.Title>
      <div className="mt-2">
        {/* Type */}
        <div>
          <small className="text-black dark:text-white">Tipo</small>
          <Input
            select
            value={form.type}
            onValueChange={(value) => {
              setForm((prev) => ({
                ...prev,
                type: value,
              }));

              setCategory(undefined);
            }}
          >
            <option value="i">Entrata</option>
            <option value="o">Uscita</option>
            <option value="t">Trasferimento</option>
          </Input>
        </div>

        {/* Wallet */}
        <div className="mb-2">
          <small className="text-black dark:text-white">
            {form.type === "t" ? "Dal conto" : "Conto"}
          </small>
          <SearchableCombobox
            items={wallets}
            selectedItem={wallet}
            keyMap={(item) => item.id}
            labelMap={(item) => item.name}
            filter={(query, item) =>
              item.name.toLocaleLowerCase().includes(query)
            }
            onItemChange={setWallet}
            noItemsFoundText="Nessun conto trovato"
          />
        </div>

        {/* Wallet to */}
        {form.type === "t" && (
          <div className="mb-2">
            <small className="text-black dark:text-white">Al conto</small>
            <SearchableCombobox
              items={walletToValues}
              selectedItem={walletTo}
              keyMap={(item) => item.id}
              labelMap={(item) => item.name}
              filter={(query, item) =>
                item.name.toLocaleLowerCase().includes(query)
              }
              onItemChange={setWalletTo}
              noItemsFoundText="Nessun conto trovato"
            />
          </div>
        )}

        {/* Category */}
        {form.type !== "t" && (
          <div className="mb-2">
            <small className="text-black dark:text-white">Categoria</small>
            <SearchableCombobox
              items={categoriesToShow}
              selectedItem={category}
              keyMap={(item) => item.id}
              labelMap={(item) => item.name}
              filter={(query, item) =>
                item.name.toLocaleLowerCase().includes(query)
              }
              onItemChange={setCategory}
              noItemsFoundText="Nessuna categoria trovata"
            />
          </div>
        )}

        {/* Date and time */}
        <div>
          <div className="flex">
            <div className="flex-1 mr-1">
              <small className="text-black dark:text-white">Data</small>
              <Input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
              />
            </div>
            <div className="flex-1 ml-1">
              <small className="text-black dark:text-white">Ora</small>
              <Input
                type="time"
                name="time"
                value={form.time}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <small className="text-black dark:text-white">Descrizione</small>
          <Input
            type="textarea"
            name="description"
            value={form.description}
            onChange={handleFormChange}
          />
        </div>

        {/* Amount */}
        <div className="mb-3">
          <small className="text-black dark:text-white">Ammontare</small>
          <Input
            type="number"
            min={0}
            step=".01"
            name="amount"
            defaultValue={form.amount}
            onChange={handleFormChange}
          />
        </div>

        {(createTx.status === "error" || updateTx.status === "error") && (
          <div className="dark:text-white">
            <p>An error occurred, try again</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end items-center space-x-3">
        <Button
          color="primary"
          disabled={createTx.status === "loading" && updateTx.status === "loading"}
          onClick={handleSubmit}
        >
          {data.type === "AddTransaction" ? "Aggiungi" : "Modifica"}
          {/* Modifica */}
        </Button>
      </div>
    </>
  );
};

function getTxDefaults(
  data: TransactionDialogData | null,
  wallets: Wallet[] | undefined,
  categories: Category[] | undefined,
) {
  if (!data || data.type !== "EditTransaction") return null;

  return {
    wallet: wallets?.find((w) => w.id === data.transaction.walletId),
    walletTo: wallets?.find((w) => w.id === data.transaction.walletToId),
    category: categories?.find((w) => w.id === data.transaction.categoryId),
    amount: data.transaction.amount ?? 0,
    date: moment(data.transaction.date).format("YYYY-MM-DD"),
    time: moment(data.transaction.date).format("HH:mm"),
    description: data.transaction.description ?? "",
    type: data.transaction.type ?? "i",
  };
}

function useForm<T = { [key: string]: string }>(
  defaultState: T,
): [
  T,
  React.Dispatch<React.SetStateAction<T>>,
  (e: React.ChangeEvent<HTMLInputElement>) => void,
] {
  const [form, setForm] = useState(defaultState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value } as T));
  };

  return [form, setForm, handleChange];
}
