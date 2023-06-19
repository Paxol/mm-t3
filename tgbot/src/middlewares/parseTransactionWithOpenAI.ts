import { format, parse as parseDate } from "date-fns";
import { NextFunction } from "grammy";
import { MenuTemplate } from "grammy-inline-menu";

import { MyContext } from "../types";

export const parseTransactionWithOpenAI = async (
  ctx: MyContext,
  next: NextFunction,
) => {
  if (ctx.message?.text === undefined) return await next();

  const { msg, state } = handleMessage(ctx.message.text);

  const menu = new MenuTemplate<MyContext>(`Nuova transazione\n\n${msg}`);
  

  await ctx.reply(msg);
  await ctx.reply(JSON.stringify(state, null, 2));

  return await next();
};

const typeToString = (type: "o" | "i" | "t") => {
  switch (type) {
    case "i":
      return "Entrata";
    case "o":
      return "Uscita";
    case "t":
      return "Trasferimento";

    default:
      return "";
  }
};

const parse = (msg: string) => {
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

function handleMessage(message: string) {
  const parsed = parse(message);

  const amount = parsed.amount ? Number.parseInt(parsed.amount) : undefined;

  const description = parsed.isPosPayment
    ? parsed.smallDescription
    : parsed.description;

  const date = parsed.dateInDescription ?? parsed.date;

  const type = parsed.isExpense ? "o" : "i";

  const hasDescription = !!description;
  const hasAmount = amount !== undefined && !Number.isNaN(amount);
  const hasDate = !!date;

  const state = {
    parsed,
    partial: {
      amount,
      description,
      date,
      type,
    },

    progress: {
      hasDescription,
      hasAmount,
      hasDate,
      hasWallet: false,
      hasWalletTo: false,
      hasCategory: false,
    },

    object: {
      amount,
      description,
      date,
      type,
    },
  };

  const msgBuilder = [] as string[];

  type && msgBuilder.push(typeToString(type));
  hasDescription && msgBuilder.push(description);
  hasAmount && msgBuilder.push(`${amount} €`);
  hasDate && msgBuilder.push(format(date, "dd/MM/yyyy HH:mm"));
  const msg = msgBuilder.join("\n");

  return { msg, state };
}
