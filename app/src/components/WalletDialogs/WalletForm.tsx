import { FC, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";

import { Input } from "../Input";
import { Select } from "../Select";

export type WalletFormData = {
  name: string;
  type: number;
  initialValue: number;
};

export const WalletForm: FC<
  PropsWithChildren<{
    onSubmit: (item: WalletFormData) => void;
    item?: WalletFormData;
    className?: string;
  }>
> = ({ item, onSubmit, className, children }) => {
  const { register, handleSubmit } = useForm<WalletFormData>({
    defaultValues: item ?? { initialValue: 0 },
  });

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
        <Select {...register("type", { required: true, valueAsNumber: true })}>
          <option value="0">Liquidità</option>
          <option value="1">Investimento</option>
        </Select>
      </div>

      <div>
        <small className="text-black dark:text-white">Bilancio iniziale</small>
        <Input
          {...register("initialValue", { required: true, valueAsNumber: true })}
          type="number"
          min={0}
          step=".01"
        />
      </div>

      {children}
    </form>
  );
};
