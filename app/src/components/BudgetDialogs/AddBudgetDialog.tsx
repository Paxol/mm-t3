import React, { FC, useCallback, useState } from "react";
import { MdAdd } from "react-icons/md";

import { api } from "~/utils/api";
import {
  BudgetForm,
  BudgetFormData,
} from "~/components/BudgetDialogs/BudgetForm";
import { Card } from "~/components/Card";
import { Dialog, DialogTitle } from "~/components/Dialog";
import { TwButton } from "../TwButton";

export const AddBudgetDialog: FC = () => {
  const ctx = api.useContext();
  const add = api.budgets.add.useMutation();

  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = useCallback(
    async (data: BudgetFormData) => {
      await add.mutateAsync({
        categoryId: data.category.id,
        amount: data.amount,
        type: data.type,
      });

      ctx.budgets.get.invalidate();
      setIsOpen(false)
    },
    [ctx.budgets.get, add],
  );

  return (
    <>
      <Card
        className="flex items-center justify-center gap-2 cursor-pointer dark:text-white"
        direction="horizontal"
        role="button"
        onClick={() => setIsOpen(true)}
      >
        <MdAdd className="h-4 w-4" />
        <span>Aggiungi</span>
      </Card>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle
          className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
          as="h3"
        >
          Aggiungi budget
        </DialogTitle>
        <BudgetForm className="pt-2" onSubmit={handleSubmit}>
          <div className="flex items-center justify-end gap-2 mt-2">
            <TwButton variant="secondary" type="button" onClick={() => setIsOpen(false)}>
              Annulla
            </TwButton>
            <TwButton>Aggiungi</TwButton>
          </div>
        </BudgetForm>
      </Dialog>
    </>
  );
};
