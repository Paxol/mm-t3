import React, { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Category, Wallet } from "@paxol/db";

import { api, type RouterInputs } from "~/utils/api";
import {
  ParsedTransactionDraft,
  parseExcelTransactions,
} from "~/utils/excelTxImport";
import { Button as LegacyButton } from "~/components/Button";
import { ImportTransactionsForm } from "~/components/TransactionDialogs/ImportTransactionsForm";
import { TransactionsPreviewTable } from "~/components/TransactionDialogs/TransactionsPreviewTable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type ImportTransactionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  categories: Category[];
  onCompleted?: () => void;
};

type BulkCreateInput =
  RouterInputs["transactions"]["bulkCreate"]["items"][number];

dayjs.extend(customParseFormat);

export const ImportTransactionsDialog: React.FC<
  ImportTransactionsDialogProps
> = ({ open, onOpenChange, wallets, categories, onCompleted }) => {
  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<ParsedTransactionDraft[]>([]);
  const [globalWarnings, setGlobalWarnings] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | undefined>();
  const [hasParsed, setHasParsed] = useState(false);
  const [defaultWalletIdState, setDefaultWalletIdState] = useState<
    string | undefined
  >(wallets.at(0)?.id);
  const [numberParsingStyle, setNumberParsingStyle] = useState<"ita" | "eng">(
    "ita",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const apiContext = api.useContext();

  const bulkCreateMutation = api.transactions.bulkCreate.useMutation({
    onSuccess: async () => {
      await Promise.all([
        apiContext.transactions.getRange.invalidate(),
        apiContext.wallets.invalidate(),
        apiContext.dashboard.invalidate(),
      ]);
      setIsSubmitting(false);
      resetState();
      onOpenChange(false);
      onCompleted?.();
    },
    onError: (err) => {
      setIsSubmitting(false);
      setSubmitError(err.message ?? "Errore durante l'importazione");
    },
  });

  const resetState = () => {
    setRawText("");
    setDrafts([]);
    setGlobalWarnings([]);
    setParseError(undefined);
    setHasParsed(false);
    setSubmitError(null);
    setNumberParsingStyle("ita");
    setDefaultWalletIdState(wallets.at(0)?.id);
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      resetState();
    }
    onOpenChange(next);
  };

  const handleParse = useCallback(() => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      setParseError("Incolla del testo da Excel prima di procedere.");
      setHasParsed(false);
      setDrafts([]);
      setGlobalWarnings([]);
      return;
    }

    try {
      const { drafts: parsedDrafts, globalWarnings: warnings } =
        parseExcelTransactions(trimmed, {
          numberParsingStyle: numberParsingStyle,
          defaultWalletId: defaultWalletIdState,
          defaultCategoryId: {
            in: categories.find((x) => x.type == "in")?.id,
            out: categories.find((x) => x.type == "out")?.id,
          },
        });

      setDrafts(parsedDrafts);
      setGlobalWarnings(warnings);
      setHasParsed(true);
      setParseError(undefined);
      setSubmitError(null);
    } catch (e) {
      setParseError("Errore durante l'analisi del testo. Verifica il formato.");
      setHasParsed(false);
      setDrafts([]);
      setGlobalWarnings([]);
    }
  }, [rawText, defaultWalletIdState, numberParsingStyle]);

  const selectedDrafts = useMemo(
    () => drafts.filter((d) => d.selected),
    [drafts],
  );

  const hasInvalidSelected = useMemo(
    () => selectedDrafts.some((d) => !d.validation.isRowValid),
    [selectedDrafts],
  );

  const isConfirmDisabled =
    isSubmitting || selectedDrafts.length === 0 || hasInvalidSelected;

  const mapDraftToInput = (draft: ParsedTransactionDraft): BulkCreateInput => {
    // defensive checks; Confirm button should prevent invalid drafts
    if (!draft.date) {
      throw new Error("Bozza senza data valida");
    }
    if (!draft.amount || draft.amount <= 0) {
      throw new Error("Bozza senza importo valido");
    }
    if (!draft.walletId) {
      throw new Error("Bozza senza conto valido");
    }

    const dateTime = dayjs(
      draft.date + " " + draft.time,
      "YYYY-MM-DD HH:mm",
    ).toISOString();

    if (draft.type === "t") {
      if (!draft.walletToId) {
        throw new Error("Bozza trasferimento senza conto di destinazione");
      }

      return {
        amount: draft.amount,
        date: dateTime,
        description: draft.description,
        walletId: draft.walletId,
        type: "t",
        walletToId: draft.walletToId,
      } as BulkCreateInput;
    }

    if (!draft.categoryId) {
      throw new Error("Bozza senza categoria");
    }

    return {
      amount: draft.amount,
      date: dateTime,
      description: draft.description,
      walletId: draft.walletId,
      type: draft.type,
      categoryId: draft.categoryId,
    } as BulkCreateInput;
  };

  const handleConfirm = async () => {
    setSubmitError(null);

    const selected = drafts.filter((d) => d.selected);

    if (selected.length === 0) {
      setSubmitError("Seleziona almeno una riga valida da importare.");
      return;
    }

    if (selected.some((d) => !d.validation.isRowValid)) {
      setSubmitError(
        "Alcune righe selezionate non sono valide. Correggi gli errori prima di procedere.",
      );
      return;
    }

    let items: BulkCreateInput[];
    try {
      items = selected.map(mapDraftToInput);
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : "Errore interno nella preparazione dei dati.",
      );
      return;
    }

    setIsSubmitting(true);
    bulkCreateMutation.mutate({ items });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importa transazioni da Excel</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ImportTransactionsForm
            rawText={rawText}
            onRawTextChange={setRawText}
            wallets={wallets}
            defaultWalletId={defaultWalletIdState}
            onDefaultWalletChange={setDefaultWalletIdState}
            numberParsingStyle={numberParsingStyle}
            onNumberParsingStyleChange={setNumberParsingStyle}
            onParse={handleParse}
            parseError={parseError}
            globalWarnings={globalWarnings}
          />

          {submitError && (
            <div className="rounded-md border border-red-500/80 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {submitError}
            </div>
          )}

          {hasParsed && drafts.length > 0 && (
            <TransactionsPreviewTable
              drafts={drafts}
              wallets={wallets}
              categories={categories}
              onDraftsChange={setDrafts}
              isSubmitting={isSubmitting}
            />
          )}

          {hasParsed && drafts.length === 0 && !parseError && (
            <div className="text-sm text-muted-foreground">
              Nessuna riga valida trovata nel testo incollato.
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <LegacyButton
            type="button"
            invert
            onClick={() => handleDialogOpenChange(false)}
            disabled={isSubmitting}
          >
            Annulla
          </LegacyButton>
          <LegacyButton
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isSubmitting
              ? "Importazione in corso..."
              : "Conferma importazione"}
          </LegacyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
