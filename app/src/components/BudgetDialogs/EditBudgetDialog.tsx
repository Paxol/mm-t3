import React, { FC, useCallback, useEffect, useState } from "react";
import { atom, useAtomValue } from "jotai";
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

export const EditBudgetItemAtom = atom<BudgetWithCategory | null>(null);

export const EditBudgetDialog: FC = () => {
  const ctx = api.useContext();
  const edit = api.budgets.update.useMutation();
  const remove = api.budgets.remove.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const item = useAtomValue(EditBudgetItemAtom);

  useEffect(() => {
    if (item) setIsOpen(true);
  }, [item]);

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
      setIsOpen(false);
    },
    [ctx.budgets.get, edit],
  );

  const handleDelete = useCallback(async () => {
    if (!item?.id) return;

    await remove.mutateAsync({ id: item.id });

    ctx.budgets.get.invalidate();
    setIsOpen(false);
  }, [remove, item?.id, ctx.budgets.get]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
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
          <TwButton
            variant="secondary"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Annulla
          </TwButton>
          <TwButton>Modifica</TwButton>
        </div>
      </BudgetForm>
    </Dialog>
  );
};
