import React, { useCallback, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { useAtom } from "jotai";

import { api } from "~/utils/api";
import { Button } from "../Button";
import { dialogOpenAtom } from "./TansactionDialogContainer";

export type DeleteTransactionData = {
  type: "DeleteTransaction";

  id: string;
  description?: string;
  amount: number;
};

export const DeleteTransaction: React.FC<DeleteTransactionData> = (data) => {
  const apiContext = api.useContext();
  const { status, mutate } = api.transactions.delete.useMutation();
  const [, setDialogOpen] = useAtom(dialogOpenAtom);

  useEffect(() => {
    if (status === "success") {
      setDialogOpen(false);
      apiContext.transactions.getRange.invalidate();
    }
  });

  const handleDelete = useCallback(() => mutate(data.id), [mutate, data.id]);

  return (
    <>
      <Dialog.Title
        as="h3"
        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
      >
        Elimina transazione
      </Dialog.Title>

      <span className="dark:text-white">
        Sei sicuro di voler eliminare la transazione {data.description || ""}{" "}
        del valore di {data.amount.toFixed(2)} €?
      </span>

      {status === "error" && (
        <span className="mt-3 dark:text-white">
          Si è verificato un errore, prova ancora
        </span>
      )}

      <div className="mt-4 flex justify-end items-center space-x-3">
        <Button color="primary" onClick={() => setDialogOpen(false)}>
          Annulla
        </Button>
        <Button color="primary" onClick={handleDelete}>
          Elimina
        </Button>
      </div>
    </>
  );
};
