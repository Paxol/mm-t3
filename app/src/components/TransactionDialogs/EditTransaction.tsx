import React, { useCallback, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import moment from "moment";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Category, Transaction, Wallet } from "@paxol/db";

import { api } from "~/utils/api";
import { Button } from "../Button";
import { Input } from "../Input";
import { SearchableCombobox } from "../SearchableCombobox";
import { useTansactionDialogContext } from "./context";

export type EditTransactionDialogData = {
  type: "EditTransaction";
  mode: "add" | "modify";
  transaction?: Transaction | TransactionWithJoins;
};

export interface FormType {
  type?: string;
  date?: string;
  time?: string;
  description?: string;
  amount?: number;
}

export const EditTransaction = () => {
  const { data, close } = useTansactionDialogContext();
  const [submitDisabled, setSubmitDisabled] = useState(false);

  const apiContext = api.useContext();
  const categories = apiContext.categories.get.getData();
  const wallets = apiContext.wallets.get.getData();

  const defaultValues = {
    wallet: wallets?.find(
      (w) =>
        w.id === (data.transaction?.walletId ?? data.transaction?.walletFromId),
    ),
    walletTo: wallets?.find((w) => w.id === data.transaction?.walletToId),
    category: categories?.find((w) => w.id === data.transaction?.categoryId),
    amount: data.transaction?.amount ?? 0,
    date: moment(data.transaction?.date).format("YYYY-MM-DD"),
    time: moment(data.transaction?.date).format("HH:mm"),
    description: data.transaction?.description ?? "",
    type: data.transaction?.type ?? "i",
  };

  const [wallet, setWallet] = useState<Wallet | undefined>(
    defaultValues.wallet,
  );
  const [walletTo, setWalletTo] = useState<Wallet | undefined>(
    defaultValues.walletTo,
  );
  const [category, setCategory] = useState<Category | undefined>(
    defaultValues.category,
  );

  const [form, setForm, handleFormChange] = useForm<FormType>(defaultValues);

  const walletToValues = useMemo(
    () => wallets?.filter((w) => !wallet || w.id != wallet.id),
    [wallet, wallets],
  );

  const handleSubmit = useCallback(() => {
    setSubmitDisabled(true);

    console.log({
      ...form,
      wallet: wallet?.id,
      walletTo: walletTo?.id,
      category: category?.id,
    });

    close();
    setSubmitDisabled(false);
  }, [form, wallet, walletTo, category, close]);

  if (data.type != "EditTransaction") return null;

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
        {data.mode === "add" ? "Aggiungi transazione" : "Modifica transazione"}
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
            step=".01"
            name="amount"
            defaultValue={form.amount?.toFixed(2)}
            onChange={handleFormChange}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end items-center space-x-3">
        <Button
          color="primary"
          disabled={submitDisabled}
          onClick={handleSubmit}
        >
          {data.mode === "add" ? "Aggiungi" : "Modifica"}
        </Button>
      </div>
    </>
  );
};

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
