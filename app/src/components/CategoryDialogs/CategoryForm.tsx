import { FC, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";

import { Checkbox } from "../Checkbox";
import { Input } from "../Input";
import { Select } from "../Select";

export type CategoryFormData = {
  name: string;
  type: "in" | "out";
  atBalance: boolean;
};

export const CategoryForm: FC<
  PropsWithChildren<{
    onSubmit: (item: CategoryFormData) => void;
    item?: CategoryFormData;
    className?: string;
  }>
> = ({ item, onSubmit, className, children }) => {
  const { register, watch, setValue, handleSubmit } = useForm<CategoryFormData>(
    {
      defaultValues: item ?? { type: "in", atBalance: true },
    },
  );

  return (
    <form className={className} onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2 mb-2">
        <div>
          <small className="text-black dark:text-white">Nome</small>
          <Input {...register("name", { required: true })} />
        </div>
      </div>

      <div>
        <small className="text-black dark:text-white">Tipo</small>
        <Select {...register("type", { required: true })}>
          <option value="in">Entrata</option>
          <option value="out">Uscita</option>
        </Select>
      </div>

      <div>
        <Checkbox
          checked={watch("atBalance")}
          onChange={({ target: { checked } }) => setValue("atBalance", checked)}
        >
          Includi nei saldi
        </Checkbox>
      </div>

      {children}
    </form>
  );
};
