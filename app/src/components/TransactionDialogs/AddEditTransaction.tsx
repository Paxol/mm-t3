import React, { useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { useSetAtom } from "jotai";
import { TransactionWithJoins } from "@paxol/api/src/types";
import { Transaction } from "@paxol/db";

import { api } from "~/utils/api";
import { Button } from "~/components/Button";
import { dialogOpenAtom } from "~/components/TransactionDialogs/TransactionDialogContainer";
import { TransactionForm, TransactionFormResult } from "./TransactionForm";

export type TransactionDialogData =
  | {
      type: "EditTransaction";
      transaction: Transaction | TransactionWithJoins;
    }
  | {
      type: "AddTransaction";
      transaction?: Partial<Transaction | TransactionWithJoins>;
    };

export const AddEditTransaction: React.FC<TransactionDialogData> = (props) => {
  const setDialogOpen = useSetAtom(dialogOpenAtom);
  const apiContext = api.useContext();

  const onMutationSuccess = useCallback(() => {
    setDialogOpen(false);
    apiContext.transactions.getRange.invalidate();
    apiContext.wallets.invalidate();
    apiContext.dashboard.invalidate();
  }, [setDialogOpen, apiContext]);

  const createTx = api.transactions.create.useMutation({
    onSuccess: onMutationSuccess,
  });
  const updateTx = api.transactions.update.useMutation({
    onSuccess: onMutationSuccess,
  });

  const categories = apiContext.categories.get.getData();
  const wallets = apiContext.wallets.get
    .getData()
    ?.sort((a, b) => (b.name > a.name ? -1 : 1));

  const handleSubmit = useCallback(
    (values: TransactionFormResult) => {
      if (props.type === "AddTransaction") createTx.mutate(values);

      if (props.type === "EditTransaction" && props.transaction?.id)
        updateTx.mutate({ ...values, id: props.transaction.id });
    },
    [props, createTx, updateTx],
  );

  if (!categories || !wallets) return null;

  return (
    <>
      <Dialog.Title as="h3" className="text-lg font-medium leading-6">
        {props.type === "AddTransaction"
          ? "Aggiungi transazione"
          : "Modifica transazione"}
      </Dialog.Title>

      <TransactionForm
        wallets={wallets}
        categories={categories}
        defaultValues={props.transaction}
        onSubmit={handleSubmit}
      >
        <div className="mt-4 flex justify-end items-center space-x-3">
          <Button
            color="primary"
            disabled={
              createTx.status === "loading" && updateTx.status === "loading"
            }
          >
            {props.type === "AddTransaction" ? "Aggiungi" : "Modifica"}
          </Button>
        </div>
      </TransactionForm>
    </>
  );
};
