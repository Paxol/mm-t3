import React, { FC, useCallback } from "react";

import { api } from "~/utils/api";
import {
  BudgetForm,
  BudgetFormData,
} from "~/components/BudgetDialogs/BudgetForm";
import { Dialog, DialogTitle } from "~/components/Dialog";
import { TwButton } from "../TwButton";

type DialogProps = {
  open: boolean;
  onClose: () => void;
};
export const AddBudgetDialog: FC<DialogProps> = ({ open, onClose }) => {
  const ctx = api.useContext();
  const add = api.budgets.add.useMutation();

  const handleSubmit = useCallback(
    async (data: BudgetFormData) => {
      await add.mutateAsync({
        categoryId: data.category.id,
        amount: data.amount,
        type: data.type,
      });

      ctx.budgets.get.invalidate();
      onClose();
    },
    [ctx.budgets.get, add, onClose],
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
        as="h3"
      >
        Aggiungi budget
      </DialogTitle>
      <BudgetForm className="pt-2" onSubmit={handleSubmit}>
        <div className="flex items-center justify-end gap-2 mt-2">
          <TwButton variant="secondary" type="button" onClick={onClose}>
            Annulla
          </TwButton>
          <TwButton>Aggiungi</TwButton>
        </div>
      </BudgetForm>
    </Dialog>
  );
};
