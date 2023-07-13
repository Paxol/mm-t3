import { FC, useCallback } from "react";
import { IoReload } from "react-icons/io5";
import { MdCheck } from "react-icons/md";

import { api } from "~/utils/api";
import { DialogTitle } from "../Dialog";
import { TwButton } from "../TwButton";
import { WalletForm, WalletFormData } from "./WalletFormData";

export const AddWalletDialog: FC<{onClose: () => void}> = ({onClose}) => {
  const ctx = api.useContext();
  const add = api.wallets.add.useMutation();

  const handleSubmit = useCallback(
    async (data: WalletFormData) => {
      try {
        await add.mutateAsync(data);
        ctx.wallets.get.invalidate();
        onClose();
      } catch {
        /* empty */
      }
    },
    [add, ctx.wallets.get, onClose],
  );

  return (
    <>
      <DialogTitle
        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
        as="h3"
      >
        Aggiungi conto
      </DialogTitle>
      <WalletForm className="pt-2" onSubmit={handleSubmit}>
        {add.isError && (
          <div className="mt-2">Si è verificato un errore, riprova</div>
        )}
        <div className="flex items-center justify-end gap-2 mt-2">
          <TwButton
            variant="secondary"
            type="button"
            onClick={() => onClose()}
          >
            Annulla
          </TwButton>
          {add.isLoading ? (
            <TwButton type="button" disabled size="icon">
              <IoReload className="h-4 w-4 animate-spin" />
            </TwButton>
          ) : add.isSuccess ? (
            <TwButton type="button">
              <MdCheck className="mr-2 h-4 w-4" /> Fatto
            </TwButton>
          ) : (
            <TwButton>Aggiungi</TwButton>
          )}
        </div>
      </WalletForm>
    </>
  );
};
