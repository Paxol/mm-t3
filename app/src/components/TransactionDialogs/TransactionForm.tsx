import React, { useCallback, useEffect, useMemo } from "react";
import moment from "moment";
import {
  FormProvider,
  UseFormRegister,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Transaction, Wallet } from "@paxol/db";

import { Input } from "../Input";
import { SearchableCombobox } from "../SearchableCombobox";
import { Select } from "../Select";
import { TransactionWithJoins } from "@paxol/api/src/types";

const transactionRequestSchema = z
  .object({
    amount: z.number(),
    date: z.string(),
    time: z.string(),
    description: z.string(),
    wallet: z.object({ id: z.string(), name: z.string() }),
  })
  .and(
    z.union([
      z.object({
        type: z.literal("t"),
        walletTo: z.object({ id: z.string(), name: z.string() }),
      }),
      z.object({
        type: z.union([z.literal("i"), z.literal("o")]),
        category: z.object({ id: z.string(), name: z.string() }),
      }),
    ]),
  );

// Type from zod schema, avoiding to call z.infer to don't stress typescript language server
type FormValues = {
  amount: number;
  date: string;
  time: string;
  description: string;
  wallet: {
    id: string;
    name: string;
  };
} & (
  | {
      type: "t";
      walletTo: {
        id: string;
        name: string;
      };
    }
  | {
      type: "i" | "o";
      category: {
        id: string;
        name: string;
      };
    }
);

export type TransactionFormResult = {
  walletId: string;
  date: string;
  description: string;
  amount: number;
} & (
  | {
      type: "t";
      walletToId: string;
    }
  | {
      type: "i" | "o";
      categoryId: string;
    }
);

function mapToRequest(formValues: FormValues): TransactionFormResult {
  const isoDate = moment(`${formValues.date} ${formValues.time}`).toISOString();

  if (formValues.type === "t") {
    return {
      type: "t",
      walletId: formValues.wallet.id,
      walletToId: formValues.walletTo.id,

      date: isoDate,
      description: formValues.description,
      amount: formValues.amount,
    } satisfies TransactionFormResult;
  }

  return {
    type: formValues.type,
    categoryId: formValues.category.id,
    walletId: formValues.wallet.id,

    date: isoDate,
    description: formValues.description,
    amount: formValues.amount,
  } satisfies TransactionFormResult;
}

type TransactionFormProps = React.PropsWithChildren<
  Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
    wallets: Wallet[];
    categories: Category[];
    defaultValues?: Partial<Transaction | TransactionWithJoins>;
    onSubmit: (value: TransactionFormResult) => void;
  }
>;

export function TransactionForm({
  wallets,
  categories,
  children,
  defaultValues,
  onSubmit,
  ...formProps
}: TransactionFormProps) {
  const methods = useForm<FormValues>({
    defaultValues: getTxDefaults(defaultValues, wallets, categories),
    resolver: zodResolver(transactionRequestSchema),
  });
  const type = methods.watch("type");
  console.log("Rendering... the type is: ", type);

  const formSubmitCallback = useCallback(
    (value: FormValues) => {
      const reuest = mapToRequest(value);
      onSubmit(reuest);
    },
    [onSubmit],
  );

  const currentWalletId = methods.watch("wallet.id");

  const walletToValues = useMemo(
    () => wallets?.filter((w) => !currentWalletId || w.id != currentWalletId),
    [currentWalletId, wallets],
  );

  return (
    <form
      className="flex flex-col gap-2"
      {...formProps}
      onSubmit={methods.handleSubmit(formSubmitCallback)}
    >
      <FormProvider {...methods}>
        <div>
          <TransactionType {...methods.register("type")} />
        </div>

        <div>
          <WalletSelect
            label={type == "t" ? "Dal conto" : "Conto"}
            wallets={wallets}
          />
        </div>

        {type === "t" && (
          <div>
            <WalletSelect
              label="Al conto"
              wallets={walletToValues}
              isWalletTo
            />
          </div>
        )}

        {type !== "t" && (
          <div>
            <CategorySelect categories={categories} />
          </div>
        )}

        <div>
          <DateTimeInput />
        </div>

        <div>
          <DescriptionInput {...methods.register("description")} />
        </div>

        <div>
          <AmountInput {...methods.register("amount", {valueAsNumber: true})} />
        </div>

        {children}
      </FormProvider>
    </form>
  );
}

// Form components

const TransactionType = React.forwardRef<
  HTMLSelectElement,
  ReturnType<UseFormRegister<FormValues>>
>((props, ref) => {
  return (
    <>
      <small className="text-black dark:text-white">Tipo</small>
      <Select {...props} ref={ref} className="mb-0">
        <option value="o">Uscita</option>
        <option value="i">Entrata</option>
        <option value="t">Trasferimento</option>
      </Select>
    </>
  );
});
TransactionType.displayName = "TransactionType";

function WalletSelect(props: {
  label: string;
  wallets: Wallet[];
  isWalletTo?: boolean;
}) {
  const { label, wallets, isWalletTo = false } = props;

  const valueKey = isWalletTo ? ("walletTo" as const) : ("wallet" as const);

  const { setValue, watch } = useFormContext<FormValues>();
  const wallet = watch(valueKey);

  return (
    <>
      <small className="text-black dark:text-white">{label}</small>
      <SearchableCombobox
        items={wallets}
        selectedItem={wallet}
        keyMap={(item) => item.id}
        labelMap={(item) => item.name}
        filter={(query, item) => item.name.toLocaleLowerCase().includes(query)}
        onItemChange={(value) => {
          setValue(valueKey, value);
        }}
        noItemsFoundText="Nessun conto trovato"
      />
    </>
  );
}

function CategorySelect(props: { categories: Category[] }) {
  const { setValue, getValues, watch } = useFormContext<FormValues>();
  const type = watch("type");

  const filteredCategories = useMemo(() => {
    return props.categories.filter((c) => {
      if (type === "i") return c.type === "in";
      if (type === "o") return c.type === "out";
      return false;
    });
  }, [type, props.categories]);

  useEffect(() => {
    const categoryId = getValues("category.id");

    if (!filteredCategories.find((c) => c.id === categoryId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { id, name } = filteredCategories[0]!;
      setValue("category", { id, name });
    }
  }, [type, filteredCategories, getValues, setValue]);

  const category = watch("category");

  return (
    <>
      <small className="text-black dark:text-white">Categoria</small>
      <SearchableCombobox
        items={filteredCategories}
        selectedItem={category}
        keyMap={(item) => item.id}
        labelMap={(item) => item.name}
        filter={(query, item) => item.name.toLocaleLowerCase().includes(query)}
        onItemChange={(value) => setValue("category", value)}
        noItemsFoundText="Nessuna categoria trovata"
      />
    </>
  );
}

function DateTimeInput() {
  const { register } = useFormContext<FormValues>();

  return (
    <div className="flex">
      <div className="flex-1 mr-1">
        <small className="text-black dark:text-white">Data</small>
        <Input className="mb-0" type="date" {...register("date")} />
      </div>
      <div className="flex-1 ml-1">
        <small className="text-black dark:text-white">Ora</small>
        <Input className="mb-0" type="time" {...register("time")} />
      </div>
    </div>
  );
}

const DescriptionInput = React.forwardRef<
  HTMLInputElement,
  ReturnType<UseFormRegister<FormValues>>
>((props, ref) => {
  return (
    <>
      <small className="text-black dark:text-white">Descrizione</small>
      <Input className="mb-0" type="textarea" {...props} ref={ref} />
    </>
  );
});
DescriptionInput.displayName = "DescriptionInput";

const AmountInput = React.forwardRef<
  HTMLInputElement,
  ReturnType<UseFormRegister<FormValues>>
>((props, ref) => {
  return (
    <>
      <small className="text-black dark:text-white">Ammontare</small>
      <Input
        className="mb-0"
        type="number"
        min={0}
        step=".01"
        {...props}
        ref={ref}
      />
    </>
  );
});
AmountInput.displayName = "AmountInput";

function getTxDefaults(
  transaction: Partial<Transaction | TransactionWithJoins> | undefined,
  wallets: Wallet[],
  categories: Category[],
) {
  const type = (
    transaction?.type == "i" ||
    transaction?.type == "o" ||
    transaction?.type == "t"
      ? transaction.type
      : "o"
  ) as "i" | "o" | "t";

  return {
    wallet: wallets.find((w) => w.id === transaction?.walletId),
    walletTo: wallets.find((w) => w.id === transaction?.walletToId),
    category: categories.find((w) => w.id === transaction?.categoryId),
    amount: transaction?.amount ?? 0,
    date: moment(transaction?.date).format("YYYY-MM-DD"),
    time: moment(transaction?.date).format("HH:mm"),
    description: transaction?.description ?? "",
    type,
  };
}
