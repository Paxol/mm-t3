import React, { Fragment, useCallback } from "react";
import { Category, Wallet } from "@paxol/db";

import { ParsedTransactionDraft, validateDraft } from "~/utils/excelTxImport";
import { Checkbox } from "~/components/Checkbox";
import { Input } from "~/components/Input";
import { SearchableCombobox } from "~/components/SearchableCombobox";
import { Select } from "~/components/Select";
import { TwButton } from "~/components/TwButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type TransactionsPreviewTableProps = {
  drafts: ParsedTransactionDraft[];
  wallets: Wallet[];
  categories: Category[];
  onDraftsChange: (drafts: ParsedTransactionDraft[]) => void;
  isSubmitting?: boolean;
};

export const TransactionsPreviewTable: React.FC<
  TransactionsPreviewTableProps
> = ({ drafts, wallets, categories, onDraftsChange, isSubmitting }) => {
  const handleUpdateDraft = useCallback(
    (
      index: number,
      updater: (draft: ParsedTransactionDraft) => ParsedTransactionDraft,
    ) => {
      onDraftsChange(
        drafts.map((d, i) => {
          if (i !== index) return d;
          const updated = updater(d);
          return {
            ...updated,
            validation: validateDraft(updated),
          };
        }),
      );
    },
    [drafts, onDraftsChange],
  );

  const handleToggleSelectAll = (checked: boolean) => {
    onDraftsChange(
      drafts.map((d) => ({
        ...d,
        selected: checked,
      })),
    );
  };

  const handleDeleteRow = (index: number) => {
    const next = drafts.filter((_, i) => i !== index);
    onDraftsChange(next);
  };

  const handleAddRow = () => {
    const now = new Date();
    const iso = now.toISOString();
    const date = iso.substring(0, 10);
    const time = iso.substring(11, 16);

    const blank: ParsedTransactionDraft = {
      id: `manual-${Date.now()}`,
      sourceIndex: drafts.length,
      sourceLineText: "",
      sourceType: "manual",
      date,
      time,
      amount: 0,
      description: "",
      type: "o",
      categoryId: null,
      walletId: wallets[0]?.id ?? null,
      walletToId: null,
      selected: true,
      validation: {
        isRowValid: false,
        errors: {
          description: "Descrizione obbligatoria",
          amount: "Importo non valido",
        },
        hasParseWarning: false,
      },
    };

    onDraftsChange([...drafts, blank]);
  };

  const findWallet = (id: string | null) =>
    id ? wallets.find((w) => w.id === id) ?? null : null;

  const findCategory = (id: string | null) =>
    id ? categories.find((c) => c.id === id) ?? null : null;

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>Selezionate: {selectedCount}</div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedCount === drafts.length && drafts.length > 0}
            onChange={(e) => handleToggleSelectAll(e.target.checked)}
          >
            Seleziona tutte
          </Checkbox>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">Sel.</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Conto</TableHead>
            <TableHead>Al conto</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="w-16">Azioni</TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            <TableHead className="whitespace-nowrap">Importo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead colSpan={4}>Descrizione</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.map((draft, index) => {
            const wallet = findWallet(draft.walletId);
            const walletTo = findWallet(draft.walletToId);
            const category = findCategory(draft.categoryId);
            const hasErrors = !draft.validation.isRowValid;
            const errorMessages = Object.values(draft.validation.errors);

            const filteredCategories =
              draft.type === "i"
                ? categories.filter((c) => c.type === "in")
                : draft.type === "o"
                ? categories.filter((c) => c.type === "out")
                : categories;

            const categorySelected = category ?? null;

            const walletSelected = wallet ?? null;

            return (
              <Fragment key={draft.id}>
                <TableRow
                  key={draft.id}
                  className="border-b-0 border-t-[2px] border-solid border-[#000000be] dark:border-[#ffffff4d]"
                >
                  <TableCell>
                    <Checkbox
                      checked={draft.selected}
                      onChange={(e) =>
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          selected: e.target.checked,
                        }))
                      }
                    >
                      {""}
                    </Checkbox>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="date"
                      className={
                        draft.validation.errors.date
                          ? "border-red-500"
                          : undefined
                      }
                      value={draft.date ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          date: value || null,
                        }));
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="time"
                      className={
                        draft.validation.errors.date
                          ? "border-red-500"
                          : undefined
                      }
                      value={draft.time ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          time: value || null,
                        }));
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Select
                      value={draft.type}
                      onChange={(e) => {
                        const t = e.target.value as "i" | "o" | "t";
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          type: t,
                          // Reset fields that may become invalid
                          walletToId: t === "t" ? d.walletToId : null,
                          categoryId:
                            t === "i" || t === "o" ? d.categoryId : null,
                        }));
                      }}
                    >
                      <option value="o">Uscita</option>
                      <option value="i">Entrata</option>
                      <option value="t">Trasferimento</option>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <SearchableCombobox
                      items={wallets}
                      selectedItem={walletSelected ?? undefined}
                      keyMap={(item) => item.id}
                      labelMap={(item) => item.name}
                      filter={(query, item) =>
                        item.name
                          .toLocaleLowerCase()
                          .includes(query.toLocaleLowerCase())
                      }
                      onItemChange={(w) =>
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          walletId: (w as Wallet).id,
                        }))
                      }
                      noItemsFoundText="Nessun conto trovato"
                    />
                  </TableCell>

                  <TableCell>
                    {draft.type === "t" ? (
                      <SearchableCombobox
                        items={wallets.filter((w) => w.id !== draft.walletId)}
                        selectedItem={walletTo ?? undefined}
                        keyMap={(item) => item.id}
                        labelMap={(item) => item.name}
                        filter={(query, item) =>
                          item.name
                            .toLocaleLowerCase()
                            .includes(query.toLocaleLowerCase())
                        }
                        onItemChange={(w) =>
                          handleUpdateDraft(index, (d) => ({
                            ...d,
                            walletToId: (w as Wallet).id,
                          }))
                        }
                        noItemsFoundText="Nessun conto trovato"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">N/D</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span
                        className={
                          hasErrors
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {hasErrors ? "Con errori" : "Valida"}
                      </span>
                      {errorMessages.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[10px] text-red-500 dark:text-red-300">
                          {errorMessages.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <TwButton
                      variant="secondary"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => handleDeleteRow(index)}
                    >
                      Elimina
                    </TwButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell></TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step=".01"
                      className={
                        draft.validation.errors.amount
                          ? "border-red-500"
                          : undefined
                      }
                      value={draft.amount ?? 0}
                      onChange={(e) => {
                        const val = Number.parseFloat(e.target.value);
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          amount: Number.isNaN(val) ? null : Math.abs(val),
                        }));
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    {draft.type !== "t" ? (
                      <SearchableCombobox
                        items={filteredCategories}
                        selectedItem={categorySelected ?? undefined}
                        keyMap={(item) => item.id}
                        labelMap={(item) => item.name}
                        filter={(query, item) =>
                          item.name
                            .toLocaleLowerCase()
                            .includes(query.toLocaleLowerCase())
                        }
                        onItemChange={(cat) =>
                          handleUpdateDraft(index, (d) => ({
                            ...d,
                            categoryId: (cat as Category).id,
                          }))
                        }
                        noItemsFoundText="Nessuna categoria trovata"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">N/D</span>
                    )}
                  </TableCell>

                  <TableCell colSpan={4}>
                    <Input
                      type="text"
                      className={
                        draft.validation.errors.description
                          ? "border-red-500"
                          : undefined
                      }
                      value={draft.description}
                      onChange={(e) =>
                        handleUpdateDraft(index, (d) => ({
                          ...d,
                          description: e.target.value,
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-end mt-2">
        <TwButton
          variant="secondary"
          size="sm"
          disabled={isSubmitting}
          onClick={handleAddRow}
        >
          Aggiungi riga
        </TwButton>
      </div>
    </div>
  );
};
