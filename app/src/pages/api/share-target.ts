import { NextApiRequest, NextApiResponse } from "next";
import moment from "moment";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sharedText = req.query.text;
  if (typeof sharedText != "string") return res.redirect(302, "/");

  const parsed = parse(sharedText);

  const tx = getTx(parsed);
  res.redirect(302, "/?tx=" + JSON.stringify(tx));
}

type RawTx = ReturnType<typeof parse>;
export type SharedTx = ReturnType<typeof getTx>;

function parse(msg: string) {
  const isPosPayment =
    msg.match(/^Tipologia: PAGAMENTO TRAMITE POS$/im) !== null ||
    msg.match(/^Tipologia: Pagamento internazionale$/im) !== null;

  const amountWithSign = msg.match(/^Importo: ([-\d,.]+).*$/im)?.at(1);
  const isExpense = amountWithSign?.includes("-");
  const amount = amountWithSign
    ? Math.abs(parseFormattedNumber(amountWithSign, 2))
    : undefined;

  const dateString = msg.match(/^Data operazione: ([\d/]*)$/im)?.at(1);
  const date = dateString ? moment(dateString, "DD/MM/YYYY") : undefined;

  const description = msg.match(/^Descrizione: (.*)$/im)?.at(1);

  const dateTimeMatch = description?.match(
    /^.*(\d{2}\/\d{2}\/\d{2}).*(\d\d:\d\d).*$/im,
  );
  const dateInDescription =
    dateTimeMatch && dateTimeMatch.length === 3
      ? moment(
          `${dateTimeMatch.at(1)} ${dateTimeMatch.at(2)}`,
          "DD/MM/YYYY HH:mm",
        )
      : undefined;

  const smallDescription = description
    ?.match(/POS.*ORE \d{1,2}:\d{1,2}(?: C\/O)* (.*)$/im)
    ?.at(1);

  return {
    isPosPayment,
    description,
    smallDescription,
    amount,
    isExpense,
    date,
    dateInDescription,
  };
}

function parseFormattedNumber(num: string, digits: number): number {
  return Number(
    Number(parseFloat(num.replaceAll(".", "").replaceAll(",", "."))).toFixed(
      digits,
    ),
  );
}

function getTx(parsed: RawTx) {
  const amount = parsed.amount;

  const description = parsed.isPosPayment
    ? parsed.smallDescription
    : parsed.description;

  const date = (parsed.dateInDescription ?? parsed.date)?.toISOString();

  const type = parsed.isExpense ? "o" : "i";

  return {
    amount,
    description: description ? capitalize(description) : undefined,
    date,
    type,
  };
}

function capitalize(str: string) {
  const arr = str.toLocaleLowerCase().split(" ");

  const str2 = arr.map(el => el.charAt(0).toUpperCase() + el.slice(1)).join(" ");
  return str2;
}
