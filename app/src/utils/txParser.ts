import moment from "moment";

export type ParsedTx = {
  amount: number | undefined;
  description: string | undefined;
  date: string | undefined;
  type: string;
}

export function parse(msg: string) : ParsedTx {
  if (isNexiMessage(msg)) return parseNexiMessage(msg);

  return getTx(fallbackParse(msg));
}

// Nexi parse

const nexiPrefix = "Richiesta autorizzazione EUR ";
const DATE_TIME_ISO_STRING_NO_TIMEZONE_LENGHT = 19;

function parseNexiMessage(msg: string) : ParsedTx {
  const descriptionDelimiterPosition = msg.indexOf(" -");
  const [amountString, dayMonth, time] = msg
    .substring(nexiPrefix.length, descriptionDelimiterPosition)
    .split(" ");

  const amount = Number(amountString);
  const date = dateTimeString(moment.utc(`${dayMonth} ${time}`, "DD/MM HH.mm"));

  const endOfDescription = msg.lastIndexOf(" - ");
  const description = capitalize(
    msg.substring(descriptionDelimiterPosition + 3, endOfDescription),
  );

  return {
    amount,
    description,
    date,
    type: "o",
  };
}

function isNexiMessage(msg: string) {
  return (
    msg.startsWith(nexiPrefix) &&
    /verifica le spese della tua Carta \d{4} sul tuo internet banking$/s.test(
      msg,
    )
  );
}

// Fallback parse

function fallbackParse(msg: string) {
  const isPosPayment =
    msg.match(/^Tipologia: PAGAMENTO TRAMITE POS$/im) !== null ||
    msg.match(/^Tipologia: Pagamento internazionale$/im) !== null;

  const amountWithSign = msg.match(/^Importo: ([-\d,.]+).*$/im)?.at(1);
  const isExpense = amountWithSign?.includes("-");
  const amount = amountWithSign
    ? Math.abs(parseFormattedNumber(amountWithSign, 2))
    : undefined;

  const dateString = msg.match(/^Data operazione: ([\d/]*)$/im)?.at(1);
  const date = dateString ? moment.utc(dateString, "DD/MM/YYYY") : undefined;

  const description = msg.match(/^Descrizione: (.*)$/im)?.at(1);

  const dateTimeMatch = description?.match(
    /^.*(\d{2}\/\d{2}\/\d{2}).*(\d\d:\d\d).*$/im,
  );
  const dateInDescription =
    dateTimeMatch && dateTimeMatch.length === 3
      ? moment.utc(
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

type RawTx = ReturnType<typeof fallbackParse>;
function getTx(parsed: RawTx) : ParsedTx {
  const amount = parsed.amount;

  const description = parsed.isPosPayment
    ? parsed.smallDescription
    : parsed.description;

  const date = dateTimeString(parsed.dateInDescription ?? parsed.date)

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

  const str2 = arr
    .map((el) => el.charAt(0).toUpperCase() + el.slice(1))
    .join(" ");
  return str2;
}

function dateTimeString(dateTime?: moment.Moment) {
  return dateTime?.toISOString()
    .substring(0, DATE_TIME_ISO_STRING_NO_TIMEZONE_LENGHT);
}
