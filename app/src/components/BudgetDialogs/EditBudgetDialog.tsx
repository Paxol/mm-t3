import React, { FC, useCallback } from "react";
import { Budget, Category } from "@paxol/db";

import { api } from "~/utils/api";
import {
  BudgetForm,
  BudgetFormData,
} from "~/components/BudgetDialogs/BudgetForm";
import { Dialog, DialogTitle } from "~/components/Dialog";
import { TwButton } from "../TwButton";

type BudgetWithCategory = Budget & {
  category: Category;
};

type DialogProps = {
  open: boolean;
  onClose: () => void;
  item: BudgetWithCategory;
};
export const EditBudgetDialog: FC<DialogProps> = ({ open, onClose, item }) => {
  const ctx = api.useContext();
  const edit = api.budgets.update.useMutation();
  const remove = api.budgets.remove.useMutation();

  const handleSubmit = useCallback(
    async (data: BudgetFormData) => {
      if (!data.id) return;

      await edit.mutateAsync({
        id: data.id,
        categoryId: data.category.id,
        amount: data.amount,
        type: data.type,
      });

      ctx.budgets.get.invalidate();
      onClose();
    },
    [ctx.budgets.get, edit, onClose],
  );

  const handleDelete = useCallback(async () => {
    await remove.mutateAsync({ id: item.id });

    ctx.budgets.get.invalidate();
    onClose();
  }, [remove, item.id, ctx.budgets.get, onClose]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
        as="h3"
      >
        Modifica budget
      </DialogTitle>
      <BudgetForm className="pt-2" item={item} onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 mt-2">
          <TwButton variant="destructive" type="button" onClick={handleDelete}>
            Elimina
          </TwButton>
          <div className="flex-1"></div>
          <TwButton variant="secondary" type="button" onClick={onClose}>
            Annulla
          </TwButton>
          <TwButton>Modifica</TwButton>
        </div>
      </BudgetForm>
    </Dialog>
  );
};
