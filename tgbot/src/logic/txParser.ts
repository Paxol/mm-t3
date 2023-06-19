import { format, parse as parseDate } from "date-fns";
import { Category, Wallet } from "@paxol/db";

import { typeToString } from "../utils/txTypeConverter";

export const parse = (msg: string) => {
  const isPosPayment =
    msg.match(/^Tipologia: PAGAMENTO TRAMITE POS$/im) !== null;

  const amount = msg.match(/^Importo: ([-\d,.]+).*$/im)?.at(1);
  const isExpense = amount?.includes("-");

  const dateString = msg.match(/^Data operazione: ([\d/]*)$/im)?.at(1);
  const date = dateString
    ? parseDate(dateString, "dd/MM/yyyy", new Date())
    : undefined;

  const description = msg.match(/^Descrizione: (.*)$/im)?.at(1);

  const dateTimeMatch = description?.match(
    /^.*(\d{2}\/\d{2}\/\d{2}).*(\d\d:\d\d).*$/im,
  );
  const dateInDescription =
    dateTimeMatch && dateTimeMatch.length === 3
      ? parseDate(
          `${dateTimeMatch.at(1)} ${dateTimeMatch.at(2)}`,
          "dd/MM/yy HH:mm",
          new Date(),
        )
      : undefined;

  const smallDescription = description?.match(/POS.*C\/O (.*)$/im)?.at(1);

  return {
    isPosPayment,
    description,
    smallDescription,
    amount,
    isExpense,
    date,
    dateInDescription,
  };
};

export type TxState = ReturnType<typeof handleMessage>;
export type UnfinishedTx = {
  amount?: number;
  description?: string;
  date?: string;
  type?: string;
  category?: Pick<Category, "id" | "name" | "type">;
  wallet?: Pick<Wallet, "id" | "name">;
  walletTo?: Pick<Wallet, "id" | "name">;
};

export function handleMessage(message: string) {
  const parsed = parse(message);

  const amount = parsed.amount
    ? Math.abs(Number.parseFloat(parsed.amount.replaceAll(",", ".")))
    : undefined;

  const description = parsed.isPosPayment
    ? parsed.smallDescription
    : parsed.description;

  const date = (parsed.dateInDescription ?? parsed.date)?.toISOString();

  const type = parsed.isExpense ? "o" : "i";

  const hasDescription = !!description;
  const hasAmount = amount !== undefined && !Number.isNaN(amount);
  const hasDate = !!date;

  const tx: UnfinishedTx = {
    amount,
    description,
    date,
    type,
  };

  const state = {
    parsed,

    progress: {
      hasDescription,
      hasAmount,
      hasDate,
      hasType: true,
      hasWallet: false,
      hasWalletTo: false,
      hasCategory: false,
    },

    object: tx,
  };

  return state;
}

export const txToString = (txState?: TxState) => {
  if (!txState) return null;

  const { progress, object: tx } = txState;

  const msgBuilder = [] as string[];

  progress.hasType && msgBuilder.push(typeToString(tx.type));
  progress.hasCategory && tx.category && msgBuilder.push(tx.category.name);

  progress.hasDate &&
    tx.date &&
    msgBuilder.push(format(new Date(tx.date), "dd/MM/yyyy HH:mm"));

  progress.hasAmount &&
    tx.amount &&
    msgBuilder.push(`${tx.amount.toFixed(2)} €`);

  progress.hasDescription && tx.description && msgBuilder.push(tx.description);

  if (msgBuilder.length === 0) return null;

  return msgBuilder.join("\n");
};
