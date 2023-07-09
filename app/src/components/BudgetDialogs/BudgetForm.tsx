import React, { FC, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { Budget, Category } from "@paxol/db";

import { RouterOutputs, api } from "~/utils/api";
import { Input } from "~/components/Input";
import { SearchableCombobox } from "~/components/SearchableCombobox";
import { Select } from "~/components/Select";

type BudgetWithCategory = RouterOutputs["budgets"]["get"][number];

type BudgetFormProps = {
  item?: Partial<BudgetWithCategory>;
  onSubmit: (data: BudgetFormData) => void;
  className?: string;
};
export type BudgetFormData = {
  id?: string;
  category: Category;
  type: Budget["type"];
  amount: number;
};
export const BudgetForm: FC<PropsWithChildren<BudgetFormProps>> = ({
  item,
  onSubmit,
  className,
  children,
}) => {
  const categoriesQuery = api.categories.get.useQuery(undefined, {
    staleTime: 10000,

    select(data) {
      return data.filter(c => c.type === "out")
    },
  });

  const { register, handleSubmit, setValue, watch } = useForm<BudgetFormData>({
    defaultValues: item ?? { category: categoriesQuery?.data?.at(0) },
  });

  if (!categoriesQuery.data) return null;

  return (
    <form className={className} onSubmit={handleSubmit(onSubmit, console.log)}>
      <div className="flex flex-col gap-2 mb-2">
        <div>
          <small className="text-black dark:text-white">Categoria</small>
          <SearchableCombobox
            items={categoriesQuery.data}
            selectedItem={watch("category")}
            keyMap={(item) => item.id}
            labelMap={(item) => item.name}
            filter={(query, item) =>
              item.name.toLocaleLowerCase().includes(query)
            }
            onItemChange={(category) => setValue("category", category)}
            noItemsFoundText="Nessuna categoria trovata"
          />
        </div>
      </div>

      <div>
        <small className="text-black dark:text-white">Tipo</small>
        <Select {...register("type", { required: true })}>
          <option value="MONTHLY">Mensile</option>
          <option value="WEEKLY">Settimanale</option>
        </Select>
      </div>

      <div>
        <small className="text-black dark:text-white">Budget</small>
        <Input
          {...register("amount", { required: true, valueAsNumber: true })}
          type="number"
          min={0}
          step=".01"
        />
      </div>

      {children}
    </form>
  );
};
