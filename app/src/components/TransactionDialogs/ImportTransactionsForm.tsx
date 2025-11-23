import React from "react";
import { Wallet } from "@paxol/db";

import { Button } from "~/components/Button";
import { SearchableCombobox } from "~/components/SearchableCombobox";
import { Select } from "~/components/Select";

type ImportTransactionsFormProps = {
  rawText: string;
  onRawTextChange: (value: string) => void;
  wallets: Wallet[];
  defaultWalletId?: string;
  onDefaultWalletChange: (walletId: string | undefined) => void;
  numberParsingStyle: "ita" | "eng";
  onNumberParsingStyleChange: (style: "ita" | "eng") => void;
  onParse: () => void;
  parseError?: string;
  globalWarnings?: string[];
};

export const ImportTransactionsForm: React.FC<ImportTransactionsFormProps> = ({
  rawText,
  onRawTextChange,
  wallets,
  defaultWalletId,
  onDefaultWalletChange,
  numberParsingStyle,
  onNumberParsingStyleChange,
  onParse,
  parseError,
  globalWarnings,
}) => {
  const defaultWallet =
    wallets.find((w) => w.id === defaultWalletId) ?? wallets[0];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <small className="text-black dark:text-white">Conto predefinito</small>
        <SearchableCombobox
          items={wallets}
          selectedItem={defaultWallet}
          keyMap={(item) => item.id}
          labelMap={(item) => item.name}
          filter={(query, item) =>
            item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
          }
          onItemChange={(wallet) => onDefaultWalletChange(wallet?.id)}
          noItemsFoundText="Nessun conto trovato"
        />
      </div>

      <div>
        <small className="text-black dark:text-white">Formato numeri</small>
        <Select
          value={numberParsingStyle}
          onChange={(e) =>
            onNumberParsingStyleChange(e.target.value as "ita" | "eng")
          }
        >
          <option value="ita">Italiano</option>
          <option value="eng">Inglese</option>
        </Select>
      </div>

      <div>
        <small className="text-black dark:text-white">
          Incolla qui le righe da Excel
        </small>
        <textarea
          className="text-sm text-black sm:text-base relative w-full border-2 rounded placeholder-gray-400 focus:border-gray-300 hover:border-gray-300 outline-none py-2 px-4 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-gray-500 dark:hover:border-gray-500 dark:text-white min-h-[160px]"
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
        />
      </div>

      {parseError && (
        <div className="rounded-md border border-red-500/80 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {parseError}
        </div>
      )}

      {globalWarnings && globalWarnings.length > 0 && (
        <div className="rounded-md border border-yellow-500/70 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          {globalWarnings.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onParse}>Analizza testo</Button>
      </div>
    </div>
  );
};
