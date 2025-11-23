export type ParsedTransactionDraft = {
  id: string;
  sourceIndex: number;
  sourceLineText: string;
  sourceType: "excel" | "manual";

  date: string | null;
  time: string | null;
  amount: number | null; // always positive
  description: string;
  type: "i" | "o" | "t";

  categoryId: string | null;
  walletId: string | null;
  walletToId: string | null;

  selected: boolean;
  validation: {
    isRowValid: boolean;
    errors: {
      date?: string;
      amount?: string;
      description?: string;
      walletId?: string;
      categoryId?: string;
      walletToId?: string;
      type?: string;
    };
    hasParseWarning: boolean;
    parseWarningMessage?: string;
  };
};

export type ParseExcelTransactionsOptions = {
  defaultWalletId?: string;
  defaultCategoryId?: { in?: string; out?: string };
  numberParsingStyle: "ita" | "eng";
};

type ColumnMapping = {
  hasHeader: boolean;
  dateIdx?: number;
  amountIdx?: number;
  descriptionIdx?: number;
};

const EMPTY_VALIDATION: ParsedTransactionDraft["validation"] = {
  isRowValid: true,
  errors: {},
  hasParseWarning: false,
};

let draftIdCounter = 0;

function generateDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID();
  }

  draftIdCounter += 1;
  return `draft-${draftIdCounter}`;
}

function tokenizeLine(line: string): string[] {
  const byTab = line.split("\t");
  if (byTab.length > 1) {
    return byTab;
  }

  const bySemicolon = line.split(";");
  if (bySemicolon.length > 1) {
    return bySemicolon;
  }

  return [line];
}

function detectHeader(tokens: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    hasHeader: false,
  };

  tokens.forEach((raw, index) => {
    const normalized = raw.toLocaleLowerCase().replace(/\s+/g, "");

    if (
      normalized === "operationdate" ||
      normalized === "dataoperazione" ||
      normalized === "date" ||
      normalized === "data" ||
      normalized === "curr.date"
    ) {
      mapping.dateIdx = index;
      mapping.hasHeader = true;
      return;
    }

    if (
      normalized === "description" ||
      normalized === "descrizione" ||
      normalized === "causale"
    ) {
      mapping.descriptionIdx = index;
      mapping.hasHeader = true;
      return;
    }

    if (
      normalized === "amountcontabilizzato" ||
      normalized === "amount" ||
      normalized === "importo" ||
      normalized === "importocontabilizzato"
    ) {
      mapping.amountIdx = index;
      mapping.hasHeader = true;
      return;
    }

    if (normalized === "state" || normalized === "stato") {
      mapping.hasHeader = true;
    }
  });

  return mapping;
}

function getDefaultMapping(tokenCount: number): ColumnMapping {
  const mapping: ColumnMapping = {
    hasHeader: false,
  };

  if (tokenCount > 1) {
    mapping.dateIdx = 1;
  }

  if (tokenCount > 3) {
    mapping.descriptionIdx = 3;
  }

  if (tokenCount > 0) {
    mapping.amountIdx = tokenCount - 1;
  }

  return mapping;
}

type ParsedDate = {
  date: string;
  time: string;
};

function parseItalianDate(raw: string): ParsedDate | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})/);

  if (!match) return null;

  const day = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  let year = Number.parseInt(match[3] ?? "", 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const isoDate = `${year.toString().padStart(4, "0")}-${mm}-${dd}`;

  return {
    date: isoDate,
    time: "00:00",
  };
}

function parseNumber(raw: string, parsingStyle: "ita" | "eng"): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let noSpaces = trimmed.replace(/\s+/g, "");
  if (!noSpaces) return null;

  if (noSpaces.startsWith("(") && noSpaces.endsWith(")")) {
    noSpaces = `-${noSpaces.substring(1, noSpaces.length - 1)}`;
  }

  const negative = noSpaces.includes("-");
  const unsigned = noSpaces.replace(/-/g, "");

  const normalized =
    parsingStyle === "ita"
      ? unsigned.replace(/\./g, "").replace(/,/g, ".")
      : unsigned.replace(/\,/g, "");

  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  const value = Number(parsed.toFixed(2));
  return negative ? -value : value;
}

export function validateDraft(
  draft: ParsedTransactionDraft,
): ParsedTransactionDraft["validation"] {
  const errors: ParsedTransactionDraft["validation"]["errors"] = {};

  if (!draft.time || !draft.date) {
    errors.date = "Data non valida o mancante";
  }

  if (draft.amount === null || draft.amount <= 0) {
    errors.amount = "Importo non valido";
  }

  if (!draft.description || draft.description.trim().length === 0) {
    errors.description = "Descrizione obbligatoria";
  }

  if (!draft.walletId) {
    errors.walletId = "Conto obbligatorio";
  }

  if (draft.type === "i" || draft.type === "o") {
    if (!draft.categoryId) {
      errors.categoryId = "Categoria obbligatoria";
    }
  }

  if (draft.type === "t") {
    if (!draft.walletToId) {
      errors.walletToId = "Conto di destinazione obbligatorio";
    } else if (draft.walletToId === draft.walletId) {
      errors.walletToId = "Il conto di destinazione deve essere diverso";
    }
  }

  const isRowValid = Object.keys(errors).length === 0;

  return {
    isRowValid,
    errors,
    hasParseWarning: false,
  };
}

function tryParseCreditAgricoleCardTransaction(description: string) {
  function parseDate(match: RegExpMatchArray): ParsedDate | null {
    const day = Number.parseInt(match[1] ?? "", 10);
    const month = Number.parseInt(match[2] ?? "", 10);
    let year = Number.parseInt(match[3] ?? "", 10);
    const hours = Number.parseInt(match[4] ?? "", 10);
    const minutes = Number.parseInt(match[5] ?? "", 10);

    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      return null;
    }

    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const isoDate = `${year.toString().padStart(4, "0")}-${mm}-${dd}`;

    const paddedHours = String(hours).padStart(2, "0");
    const paddedMinutes = String(minutes).padStart(2, "0");

    return {
      date: isoDate,
      time: `${paddedHours}:${paddedMinutes}`,
    };
  }

  const regex =
    /POS CARTA [a-zA-Z ]+N\. \*{4}\d{4} DEL (\d{2})\/(\d{2})\/(\d{2}) ORE (\d\d):(\d\d) C \/O (.+)/;
  const match = description.match(regex);

  if (!match) return { found: false as const };

  const date = parseDate(match);
  if (!date) return { found: false as const };

  const newDescription = match[6] ?? "";

  return {
    found: true as const,
    date,
    description: newDescription,
  };
}

function getCategory(
  inferredType: "i" | "o" | "t",
  defaultCategoryId?: { in?: string; out?: string },
) {
  if (!defaultCategoryId || inferredType == "t") return;

  return inferredType == "i" ? defaultCategoryId.in : defaultCategoryId.out;
}

export function parseExcelTransactions(
  text: string,
  opts: ParseExcelTransactionsOptions,
): { drafts: ParsedTransactionDraft[]; globalWarnings: string[] } {
  const drafts: ParsedTransactionDraft[] = [];
  const globalWarnings: string[] = [];

  if (!text || text.trim().length === 0) {
    return { drafts, globalWarnings };
  }

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n");
  const nonEmptyLines = rawLines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length === 0) {
    return { drafts, globalWarnings };
  }

  const firstTokens = tokenizeLine(nonEmptyLines[0] ?? "");
  const headerMapping = detectHeader(firstTokens);
  const hasHeader = headerMapping.hasHeader;
  const mapping =
    hasHeader && firstTokens.length > 0
      ? headerMapping
      : getDefaultMapping(firstTokens.length);

  const startIndex = hasHeader ? 1 : 0;

  let dataRowIndex = 0;

  for (let i = startIndex; i < nonEmptyLines.length; i += 1) {
    const line = nonEmptyLines[i] ?? "";
    const tokens = tokenizeLine(line);

    const dateRaw =
      (mapping.dateIdx !== undefined ? tokens[mapping.dateIdx] : undefined) ??
      "";
    const descriptionRaw =
      (mapping.descriptionIdx !== undefined
        ? tokens[mapping.descriptionIdx]
        : undefined) ?? "";
    const amountRaw =
      (mapping.amountIdx !== undefined
        ? tokens[mapping.amountIdx]
        : tokens[tokens.length - 1]) ?? "";

    const hasAnyContent =
      dateRaw.trim().length > 0 ||
      descriptionRaw.trim().length > 0 ||
      amountRaw.trim().length > 0;

    if (!hasAnyContent) {
      const lineNumber = i + 1;
      globalWarnings.push(`Riga ${lineNumber} ignorata: nessun dato rilevante`);
      // Do not increment dataRowIndex for skipped rows
      continue;
    }

    let parsedDate = parseItalianDate(dateRaw);
    const amountValue = parseNumber(amountRaw, opts.numberParsingStyle);
    const absAmount = amountValue !== null ? Math.abs(amountValue) : null;

    let description = descriptionRaw.trim();

    if (description) {
      const parsed = tryParseCreditAgricoleCardTransaction(description);
      if (parsed.found) {
        parsedDate = parsed.date;
        description = parsed.description;
      }
    }

    let inferredType: "i" | "o" | "t" = "o";

    if (amountValue !== null && amountValue > 0) {
      inferredType = "i";
    }

    const categoryId =
      getCategory(inferredType, opts.defaultCategoryId) ?? null;

    const baseDraft: ParsedTransactionDraft = {
      id: generateDraftId(),
      sourceIndex: dataRowIndex,
      sourceLineText: line,
      sourceType: "excel",

      time: parsedDate?.time ?? null,
      date: parsedDate?.date ?? null,
      amount: absAmount,
      description,
      type: inferredType,

      categoryId: categoryId,
      walletId: opts.defaultWalletId ?? null,
      walletToId: null,

      selected: true,
      validation: EMPTY_VALIDATION,
    };

    const validation = validateDraft(baseDraft);

    drafts.push({
      ...baseDraft,
      validation,
    });

    dataRowIndex += 1;
  }

  console.log("parsed:", { drafts, globalWarnings });

  return { drafts, globalWarnings };
}
