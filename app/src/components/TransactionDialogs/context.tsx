import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import type { EditTransactionDialogData } from "./EditTransaction";

type DialogData = EditTransactionDialogData;

type TransactionDialog = {
  isOpen: boolean;
  close: () => void;
  open: (newData: DialogData) => void;

  data: DialogData;
};

const TansactionDialogContext = createContext<TransactionDialog>(
  {} as TransactionDialog,
);

export const TansactionDialogProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({} as DialogData);

  const contextValue = useMemo<TransactionDialog>(
    () => ({
      isOpen: open,
      close: () => setOpen(false),
      open: (newData: DialogData) => {
        setData(newData);
        setOpen(true);
      },

      data,
    }),
    [open, data],
  );

  return (
    <TansactionDialogContext.Provider value={contextValue}>
      {children}
    </TansactionDialogContext.Provider>
  );
};

export const useTansactionDialogContext = () => {
  const context = useContext(TansactionDialogContext);

  if (context === undefined)
    throw new Error(
      "useTansactionDialogContext must be used within a TansactionDialogProvider",
    );

  return context;
};
