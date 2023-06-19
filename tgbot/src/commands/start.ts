import { handleMessage } from "../logic/txParser";
import { createTransaction } from "../menus";
import { MyContext } from "../types";

// TODO: rollback
export const start = (ctx: MyContext) => {
  const tx = handleMessage(`Importo: -12,40 €
Data operazione: 29/05/2023
Stato: Contabilizzato
Tipologia: PAGAMENTO TRAMITE POS
Descrizione: POS CARTA CA DEBIT VISA N. ****3289 DEL 26/05/23 ORE 12:56 C/O TBT FOOD SRL - POKE MILANO ITA`);

  ctx.session.tx = tx;

  return createTransaction.middleware.replyToContext(ctx);

  // ctx.reply("Scrivi i dettagli di una transazione, porverò a inserirla, oppure usa i comandi");
};
